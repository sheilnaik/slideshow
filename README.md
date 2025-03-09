# Photo Slideshow Web App

A lightweight, local web-based slideshow application that lets you create beautiful slideshows from photos on your computer.

## Features

- **Two Display Modes**: 
  - Standard Slideshow: Classic full-screen display
  - Vertical Dual: Shows two vertical photos side-by-side for optimal use of widescreen displays
- **Local File Access**: Access photos directly from any folder on your computer (no uploading)
- **HEIC Support**: Automatic conversion of Apple HEIC photos to viewable format
- **Folder Browser**: Visual folder selection interface
- **Configurable Settings**:
  - Adjustable display time per photo (3-15 seconds)
  - Sequential or random order
- **Full Control Interface**:
  - Play/pause, next/previous
  - Fullscreen toggle
  - Keyboard shortcuts
- **Responsive Design**: Works on various screen sizes

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:

```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:8080/`
3. Configure your slideshow settings:
   - Select a folder containing your photos using the Browse button
   - Choose between Standard or Vertical Dual display mode
   - Set the display time for each photo
   - Choose sequential or random order
4. Click "Begin Slideshow" to start

## Supported Photo Formats

- JPG/JPEG
- PNG
- GIF
- BMP
- HEIC/HEIF (Apple formats, automatically converted for viewing)

## Slideshow Controls

The slideshow controls are accessed by clicking the hamburger menu in the top right corner:

- **Play/Pause**: Toggle automatic playback
- **Previous/Next**: Navigate between photos
- **Fullscreen**: Toggle full-screen display
- **Back to Settings**: Return to the configuration page

### Keyboard Controls:
- Right Arrow: Next photo
- Left Arrow: Previous photo
- Space: Play/Pause
- F: Toggle fullscreen

## Vertical Dual Mode

The Vertical Dual mode is designed to make better use of widescreen displays when showing vertical photos:

- Automatically detects vertical photos based on their orientation
- Shows two vertical photos side-by-side with a separator between them
- Displays landscape photos normally (full width)
- Handles mixed collections with both vertical and landscape photos
- Makes optimal use of screen space on wider displays

## Privacy and Data Handling

- **100% Local**: All processing happens on your local computer
- **No Uploading**: Your photos are never uploaded to any server
- **Direct File Access**: The app reads files directly from your chosen folder
- **Temporary Conversion**: HEIC files are temporarily converted locally for viewing

## Requirements

- Python 3.6 or higher
- Flask
- Pillow (PIL Fork)
- pillow-heif (for HEIC support)
- OpenCV
- A modern web browser

## License

This project is open source and available for personal and educational use. 