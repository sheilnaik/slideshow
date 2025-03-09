document.addEventListener('DOMContentLoaded', function() {
    // Get the slideshow container
    const slideshowContainer = document.getElementById('slideshow-container');
    const loadingElement = document.getElementById('loading');
    
    // Get control buttons
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    
    // Get hamburger menu and controls
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const slideshowControls = document.getElementById('slideshow-controls');
    
    // Slideshow state
    let currentSlideIndex = 0;
    let slideshowInterval;
    let isPlaying = true;
    let images = [];
    let effect = 'standard';
    let menuTimeout = null;
    let isFullscreen = false;
    let imageOrientation = {}; // Store orientation for each image
    
    // Initialize slideshow with configuration from Flask
    function init() {
        console.log("Initializing slideshow with config:", slideshowConfig);
        effect = slideshowConfig.effect;
        folderPath = encodeURIComponent(slideshowConfig.folderPath);
        
        // Add folder path parameter to image URLs
        images = slideshowConfig.photos.map(photo => `/photos/${photo}?folder=${folderPath}`);
        
        console.log(`Total images: ${images.length} from folder: ${folderPath}`);
        
        if (effect === 'vertical-dual') {
            preloadAndDetectOrientation(() => {
                createOptimizedSlides();
                showSlide(0);
                startSlideshow();
                loadingElement.style.display = 'none';
            });
        } else {
            createStandardSlides();
            showSlide(0);
            startSlideshow();
            loadingElement.style.display = 'none';
        }
    }
    
    function preloadAndDetectOrientation(callback) {
        let loadedCount = 0;
        
        if (images.length === 0) {
            console.error("No images to display");
            loadingElement.textContent = "No images found in selected directory";
            return;
        }
        
        console.log("Preloading images and detecting orientation");
        
        images.forEach((imgSrc, index) => {
            const img = new Image();
            img.onload = function() {
                // Store orientation information
                imageOrientation[imgSrc] = {
                    isVertical: this.height > this.width,
                    width: this.width,
                    height: this.height
                };
                
                if (this.height > this.width) {
                    console.log(`Image ${index+1} is vertical: ${imgSrc}`);
                } else {
                    console.log(`Image ${index+1} is landscape: ${imgSrc}`);
                }
                
                loadedCount++;
                loadingElement.textContent = `Loading photos... (${loadedCount}/${images.length})`;
                
                if (loadedCount === images.length) {
                    console.log("All images loaded and orientation detected");
                    callback();
                }
            };
            img.onerror = function() {
                console.error('Failed to load image:', imgSrc);
                loadedCount++;
                if (loadedCount === images.length) {
                    callback();
                }
            };
            img.src = imgSrc;
        });
    }
    
    function createOptimizedSlides() {
        slideshowContainer.innerHTML = '';
        
        // Process images in the original order (which may be random)
        for (let i = 0; i < images.length; i++) {
            const currentImg = images[i];
            
            // Check if current image is vertical
            if (imageOrientation[currentImg] && imageOrientation[currentImg].isVertical) {
                // Look ahead to see if the next image is also vertical
                if (i + 1 < images.length) {
                    const nextImg = images[i + 1];
                    
                    if (imageOrientation[nextImg] && imageOrientation[nextImg].isVertical) {
                        // Create a dual slide with both vertical images
                        createDualSlide(currentImg, nextImg);
                        i++; // Skip the next image since we've used it
                        continue;
                    }
                }
                
                // If we get here, either there's no next image or it's not vertical
                // Create a standard slide for this single vertical image
                createSingleSlide(currentImg);
            } else {
                // For landscape images, create a standard slide
                createSingleSlide(currentImg);
            }
        }
        
        console.log(`Created ${slideshowContainer.children.length} slides in total`);
    }
    
    function createSingleSlide(imgSrc) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        
        const imgElement = document.createElement('img');
        imgElement.src = imgSrc;
        slide.appendChild(imgElement);
        
        slideshowContainer.appendChild(slide);
    }
    
    function createDualSlide(imgSrc1, imgSrc2) {
        const slide = document.createElement('div');
        slide.className = 'slide dual-slide';
        
        // First vertical image
        const img1 = document.createElement('img');
        img1.src = imgSrc1;
        img1.className = 'vertical-image';
        slide.appendChild(img1);
        
        // Separator
        const separator = document.createElement('div');
        separator.className = 'vertical-dual-separator';
        slide.appendChild(separator);
        
        // Second vertical image
        const img2 = document.createElement('img');
        img2.src = imgSrc2;
        img2.className = 'vertical-image';
        slide.appendChild(img2);
        
        slideshowContainer.appendChild(slide);
        console.log(`Created dual slide with images: ${imgSrc1} and ${imgSrc2}`);
    }
    
    function createStandardSlides() {
        slideshowContainer.innerHTML = '';
        
        images.forEach((imgSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            slide.appendChild(imgElement);
            
            slideshowContainer.appendChild(slide);
            console.log(`Created slide ${index+1}/${images.length}`);
        });
    }
    
    function showSlide(index) {
        const slides = document.getElementsByClassName('slide');
        if (slides.length === 0) return;
        
        // Hide all slides
        for (let i = 0; i < slides.length; i++) {
            slides[i].classList.remove('active');
        }
        
        // Show the current slide
        slides[index].classList.add('active');
        currentSlideIndex = index;
    }
    
    function nextSlide() {
        const slides = document.getElementsByClassName('slide');
        if (slides.length === 0) return;
        
        // Calculate next index with wrap-around (ensures looping)
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        console.log(`Moving to next slide: ${currentSlideIndex} -> ${nextIndex}`);
        
        showSlide(nextIndex);
    }
    
    function previousSlide() {
        const slides = document.getElementsByClassName('slide');
        if (slides.length === 0) return;
        
        // Calculate previous index with wrap-around (ensures looping)
        const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        console.log(`Moving to previous slide: ${currentSlideIndex} -> ${prevIndex}`);
        
        showSlide(prevIndex);
    }
    
    function startSlideshow() {
        if (slideshowInterval) clearInterval(slideshowInterval);
        slideshowInterval = setInterval(nextSlide, slideshowConfig.displayTime);
        isPlaying = true;
        updatePlayPauseButton();
    }
    
    function togglePlayPause() {
        if (isPlaying) {
            clearInterval(slideshowInterval);
        } else {
            startSlideshow();
        }
        isPlaying = !isPlaying;
        updatePlayPauseButton();
    }
    
    function updatePlayPauseButton() {
        btnPlayPause.textContent = isPlaying ? 'Pause' : 'Play';
    }
    
    // Toggle fullscreen function
    function toggleFullscreen() {
        if (!isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) { // Firefox
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari & Opera
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
                document.documentElement.msRequestFullscreen();
            }
            btnFullscreen.textContent = 'Exit Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari & Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
            btnFullscreen.textContent = 'Fullscreen';
        }
        isFullscreen = !isFullscreen;
    }
    
    // Update fullscreen button if fullscreen state changes externally (e.g., Esc key)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
        // Check if we're in fullscreen mode
        isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement || 
                       document.msFullscreenElement;
        
        // Update button text accordingly
        btnFullscreen.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    }
    
    // Event Listeners
    btnPlayPause.addEventListener('click', togglePlayPause);
    btnNext.addEventListener('click', () => {
        nextSlide();
        if (isPlaying) startSlideshow(); // Restart timer after manual navigation
    });
    btnPrev.addEventListener('click', () => {
        previousSlide();
        if (isPlaying) startSlideshow(); // Restart timer after manual navigation
    });
    btnFullscreen.addEventListener('click', toggleFullscreen);
    
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowLeft':
                previousSlide();
                if (isPlaying) startSlideshow();
                break;
            case 'ArrowRight':
                nextSlide();
                if (isPlaying) startSlideshow();
                break;
            case ' ':
                togglePlayPause();
                break;
            case 'f':
                toggleFullscreen();
                break;
        }
    });
    
    // Menu toggle
    hamburgerIcon.addEventListener('click', () => {
        slideshowControls.classList.toggle('visible');
    });
    
    // Set up menu auto-hide
    function setupMenuAutoHide() {
        slideshowContainer.addEventListener('mousemove', () => {
            hamburgerIcon.style.opacity = '1';
            resetMenuTimeout();
        });
        
        resetMenuTimeout();
        
        slideshowContainer.addEventListener('mouseleave', () => {
            hideMenu();
        });
    }
    
    function resetMenuTimeout() {
        if (menuTimeout) {
            clearTimeout(menuTimeout);
        }
        
        menuTimeout = setTimeout(() => {
            hideMenu();
        }, 3000);
    }
    
    function hideMenu() {
        hamburgerIcon.style.opacity = '0';
        slideshowControls.classList.remove('visible');
    }
    
    // Initialize the slideshow
    init();
    setupMenuAutoHide();
}); 