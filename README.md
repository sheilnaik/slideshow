# Photo Slideshow Web App

A web-based slideshow application that allows you to display your photos with optional Ken Burns effects that intelligently focus on faces in your photos.

## Features

- Two display modes: Standard slideshow or Ken Burns effect (panning/zooming animation)
- Face detection for intelligent Ken Burns effect focusing on faces in photos
- Configurable display time per photo
- Sequential or random order playback
- Intuitive controls (play/pause, next, previous) in a hamburger menu
- Keyboard navigation support (arrow keys, space bar)
- Responsive design for various screen sizes

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. Add your photos to the `photos` folder (supported formats: JPG, JPEG, PNG, GIF, BMP)
2. Run the application:

```bash
python app.py
```

3. Open your web browser and navigate to `http://127.0.0.1:8080/`
4. Configure your slideshow settings:
   - Choose between Ken Burns effect (with face detection) or standard slideshow
   - Set the display time for each photo
   - Choose sequential or random order
5. Click "Begin Slideshow" to start

### Note for macOS Users
If you encounter port conflicts (common on macOS where AirPlay Receiver uses port 5000), the application will run on port 8080 by default. If needed, you can modify the port in `app.py`.

## Slideshow Controls

The slideshow controls are hidden by default and will appear when you:
- Move your mouse over the slideshow area (showing the hamburger menu)
- Click on the hamburger menu to display all controls

The controls will automatically hide after 3 seconds of inactivity.

Available controls:
- **Play/Pause**: Toggle playback
- **Previous/Next**: Navigate between photos
- **Back to Settings**: Return to the configuration page
- **Keyboard Controls**:
  - Right Arrow: Next photo
  - Left Arrow: Previous photo
  - Space: Play/Pause

## Face Detection

The Ken Burns effect has been enhanced with face detection:
- When using the Ken Burns effect, the application will detect faces in your photos
- The panning and zooming will focus on faces rather than just the center of the image
- For photos with multiple faces, the animation will position to show all faces
- If no faces are detected, a default Ken Burns effect will be applied

## Requirements

- Python 3.6 or higher
- Flask
- OpenCV (for face detection)
- NumPy
- A modern web browser

## License

This project is open source and available for personal and educational use. 