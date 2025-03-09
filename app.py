import os
import random
import json
import cv2
import numpy as np
import time
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file, abort
from PIL import Image
import pillow_heif
import tempfile
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask with explicit static folder path
app = Flask(__name__, 
            static_url_path='',
            static_folder='static',
            template_folder='templates')

# Create a temporary directory for converted HEIC files
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_converted')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# Configuration
DEFAULT_PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
# Create default photos directory if it doesn't exist
if not os.path.exists(DEFAULT_PHOTOS_DIR):
    os.makedirs(DEFAULT_PHOTOS_DIR)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'heic', 'heif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_heic_to_jpeg(heic_path):
    """Convert HEIC image to JPEG format and return the path to the converted file."""
    logger.debug(f"Converting HEIC file: {heic_path}")
    
    # Generate a temporary file path
    temp_path = os.path.join(TEMP_DIR, os.path.splitext(os.path.basename(heic_path))[0] + '.jpg')
    
    # If the converted file already exists, return its path
    if os.path.exists(temp_path):
        logger.debug(f"Using cached converted file: {temp_path}")
        return temp_path
    
    try:
        logger.debug("Reading HEIC file...")
        heif_file = pillow_heif.read_heif(heic_path)
        
        logger.debug("Converting to PIL Image...")
        image = Image.frombytes(
            heif_file.mode,
            heif_file.size,
            heif_file.data,
            "raw",
            heif_file.mode,
            heif_file.stride,
        )
        
        logger.debug(f"Saving as JPEG to: {temp_path}")
        image.save(temp_path, 'JPEG', quality=95)
        return temp_path
    except Exception as e:
        logger.error(f"Error converting HEIC file {heic_path}: {str(e)}")
        return None

@app.route('/')
def index():
    """Render the landing page with slideshow configuration options."""
    # Use the last used folder or the default
    default_folder = request.cookies.get('last_folder', DEFAULT_PHOTOS_DIR)
    
    return render_template('index.html', default_folder=default_folder)

@app.route('/browse_folders')
def browse_folders():
    """API endpoint to browse folders on the server."""
    path = request.args.get('path', os.path.expanduser('~'))
    
    # Security checks
    if not os.path.exists(path):
        return jsonify(error="Path does not exist"), 404
    
    if not os.path.isdir(path):
        return jsonify(error="Path is not a directory"), 400
    
    try:
        # Get parent directory for navigation
        parent_dir = os.path.dirname(os.path.abspath(path))
        
        # List directories in the path
        dirs = []
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path) and not item.startswith('.'):
                dirs.append({
                    'name': item,
                    'path': item_path
                })
        
        # Sort directories alphabetically
        dirs.sort(key=lambda x: x['name'].lower())
        
        return jsonify({
            'current_path': path,
            'parent_path': parent_dir if parent_dir != path else None,
            'directories': dirs
        })
    except Exception as e:
        logger.error(f"Error browsing directory {path}: {str(e)}")
        return jsonify(error=str(e)), 500

@app.route('/browse')
def browse():
    """Render the folder browser page."""
    start_path = request.args.get('path', os.path.expanduser('~'))
    
    return render_template('browser.html', start_path=start_path)

@app.route('/photos/<path:filename>')
def serve_photo(filename):
    """Serve photo files, converting HEIC to JPEG if necessary."""
    folder_path = request.args.get('folder', '')
    
    if not folder_path:
        # No folder specified, return error
        abort(400, "No folder path specified")
    
    if not os.path.exists(folder_path):
        # Folder doesn't exist, return error
        abort(404, f"Folder not found: {folder_path}")

    file_path = os.path.join(folder_path, filename)
    
    # Security check to prevent directory traversal
    if not os.path.normpath(file_path).startswith(os.path.normpath(folder_path)):
        abort(403, "Access denied")
    
    if not os.path.exists(file_path):
        abort(404, f"File not found: {filename}")
    
    logger.debug(f"Serving photo: {filename} from {folder_path}")
    
    # If the file is HEIC/HEIF, convert it to JPEG
    if filename.lower().endswith(('.heic', '.heif')):
        logger.debug(f"Converting HEIC file for serving: {filename}")
        converted_path = convert_heic_to_jpeg(file_path)
        if converted_path:
            logger.debug(f"Serving converted file: {converted_path}")
            return send_file(converted_path, mimetype='image/jpeg')
        else:
            logger.error(f"Failed to convert HEIC file: {filename}")
            return "Error converting HEIC file", 500
    
    logger.debug(f"Serving original file: {filename}")
    return send_file(file_path)

@app.route('/slideshow')
def slideshow():
    """Render the slideshow page."""
    # Get folder path from the form
    folder_path = request.args.get('folder_path', '')
    
    # Validate folder
    if not folder_path or not os.path.exists(folder_path):
        if not folder_path:
            error_msg = "Please provide a folder path."
        else:
            error_msg = f"The folder '{folder_path}' does not exist."
        return render_template('error.html', error=error_msg)
    
    # Get configuration options from the query parameters
    effect = request.args.get('effect', 'standard')
    display_time = request.args.get('display_time', '5')
    order = request.args.get('order', 'sequential')
    
    logger.info(f"Starting slideshow with folder={folder_path}, effect={effect}, display_time={display_time}, order={order}")
    
    # Get list of photos in the specified directory
    photos = []
    try:
        for filename in os.listdir(folder_path):
            if allowed_file(filename):
                # For HEIC files, verify they can be converted
                if filename.lower().endswith(('.heic', '.heif')):
                    file_path = os.path.join(folder_path, filename)
                    converted_path = convert_heic_to_jpeg(file_path)
                    if converted_path:
                        photos.append(filename)
                    else:
                        logger.warning(f"Skipping unreadable HEIC file: {filename}")
                else:
                    photos.append(filename)
    except Exception as e:
        logger.error(f"Error reading directory {folder_path}: {str(e)}")
        return render_template('error.html', error=f"Error reading directory: {str(e)}")
    
    if not photos:
        return render_template('error.html', error=f"No supported images found in {folder_path}")
    
    logger.info(f"Found {len(photos)} valid photos for slideshow")
    
    # Set random seed based on current time for true randomness
    random.seed(int(time.time()))
    
    # Sort or randomize the photo list based on user preference
    if order == 'random':
        random.shuffle(photos)
        logger.info(f"Randomized photo order")
    else:
        photos.sort()
    
    # Set a cookie with the folder path for next time
    response = render_template(
        'slideshow.html',
        photos=photos,
        folder_path=folder_path,
        effect=effect,
        display_time=display_time,
        order=order
    )
    
    from flask import make_response
    resp = make_response(response)
    resp.set_cookie('last_folder', folder_path)
    
    return resp

@app.route('/get_photos')
def get_photos():
    """API endpoint to get the list of photos."""
    folder_path = request.args.get('folder', '')
    
    if not folder_path or not os.path.exists(folder_path):
        return jsonify(error="Invalid folder path"), 400
    
    photos = []
    try:
        for filename in os.listdir(folder_path):
            if allowed_file(filename):
                photos.append(filename)
    except Exception as e:
        return jsonify(error=f"Error reading directory: {str(e)}"), 500
    
    # Set random seed based on current time for true randomness
    random.seed(int(time.time()))
    
    order = request.args.get('order', 'sequential')
    if order == 'random':
        random.shuffle(photos)
        logger.debug(f"Randomized photo order for API request")
    else:
        photos.sort()
    
    logger.debug(f"Returning photo list: {photos}")
    return jsonify(photos=photos)

# Clean up temporary files when the application exits
import atexit

@atexit.register
def cleanup():
    """Clean up temporary converted files when the application exits."""
    import shutil
    if os.path.exists(TEMP_DIR):
        logger.info(f"Cleaning up temporary directory: {TEMP_DIR}")
        shutil.rmtree(TEMP_DIR)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(host='0.0.0.0', port=8080, debug=True) 