import os
import random
import json
import cv2
import numpy as np
import time
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
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

# Configure photos directory
PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
logger.info(f"Photos directory: {PHOTOS_DIR}")

# Create photos directory if it doesn't exist
if not os.path.exists(PHOTOS_DIR):
    os.makedirs(PHOTOS_DIR)

# Create a temporary directory for converted HEIC files
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_converted')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# Cache for storing face detection results
face_cache = {}

# Configuration
PHOTOS_FOLDER = 'photos'
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
    # Get list of photos in the photos directory
    photos = []
    if os.path.exists(PHOTOS_FOLDER):
        photos = [f for f in os.listdir(PHOTOS_FOLDER) if allowed_file(f)]
        photos.sort()  # Sort photos alphabetically
        logger.info(f"Found {len(photos)} photos: {photos}")
    
    return render_template('index.html', photos=photos)

@app.route('/photos/<path:filename>')
def serve_photo(filename):
    """Serve photo files, converting HEIC to JPEG if necessary."""
    logger.debug(f"Serving photo: {filename}")
    file_path = os.path.join(PHOTOS_FOLDER, filename)
    
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
    return send_from_directory(PHOTOS_FOLDER, filename)

@app.route('/slideshow')
def slideshow():
    """Render the slideshow page."""
    # Get configuration options from the query parameters
    effect = request.args.get('effect', 'standard')
    display_time = request.args.get('display_time', '5')
    order = request.args.get('order', 'sequential')
    
    logger.info(f"Starting slideshow with effect={effect}, display_time={display_time}, order={order}")
    
    # Get list of photos in the photos directory
    photos = []
    for filename in os.listdir(PHOTOS_DIR):
        if allowed_file(filename):
            # For HEIC files, verify they can be converted
            if filename.lower().endswith(('.heic', '.heif')):
                file_path = os.path.join(PHOTOS_DIR, filename)
                converted_path = convert_heic_to_jpeg(file_path)
                if converted_path:
                    photos.append(filename)
                else:
                    logger.warning(f"Skipping unreadable HEIC file: {filename}")
            else:
                photos.append(filename)
    
    logger.info(f"Found {len(photos)} valid photos for slideshow")
    
    # Set random seed based on current time for true randomness
    random.seed(int(time.time()))
    
    # Sort or randomize the photo list based on user preference
    if order == 'random':
        random.shuffle(photos)
        logger.info(f"Randomized photo order")
    else:
        photos.sort()
    
    return render_template(
        'slideshow.html',
        photos=photos,
        effect=effect,
        display_time=display_time,
        order=order
    )

def detect_faces(filename):
    """Detect faces in an image and cache the results."""
    # Check if image has already been processed
    if filename in face_cache:
        return face_cache[filename]
    
    # Load the image
    image_path = os.path.join(PHOTOS_DIR, filename)
    
    # If the image is HEIC, convert it first
    if filename.lower().endswith(('.heic', '.heif')):
        image_path = convert_heic_to_jpeg(image_path)
        if not image_path:
            face_cache[filename] = []
            return []
    
    image = cv2.imread(image_path)
    
    if image is None:
        # If the image cannot be read, return default values
        face_cache[filename] = []
        return []
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Load pre-trained face cascade classifier
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    
    # Get image dimensions
    height, width = image.shape[:2]
    
    # Process detected faces
    face_data = []
    if len(faces) > 0:
        # Convert face detection results to a list of face objects
        for (x, y, w, h) in faces:
            # Normalize coordinates to be relative to image size (0.0 to 1.0)
            face_info = {
                'x': float(x) / width,
                'y': float(y) / height,
                'width': float(w) / width,
                'height': float(h) / height
            }
            face_data.append(face_info)
    else:
        # If no faces detected, use center of image
        face_data = [{
            'x': 0.3,  # Slightly off-center for better composition
            'y': 0.3,
            'width': 0.4,
            'height': 0.4
        }]
    
    # Cache the results
    face_cache[filename] = face_data
    return face_data

@app.route('/get_photos')
def get_photos():
    """API endpoint to get the list of photos."""
    photos = []
    for filename in os.listdir(PHOTOS_DIR):
        if allowed_file(filename):
            photos.append(filename)
    
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