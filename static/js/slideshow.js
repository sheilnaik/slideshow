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
    let verticalImages = [];
    let landscapeImages = [];
    let menuTimeout = null;
    let isFullscreen = false;
    
    // Initialize slideshow with configuration from Flask
    function init() {
        console.log("Initializing slideshow with config:", slideshowConfig);
        effect = slideshowConfig.effect;
        images = slideshowConfig.photos.map(photo => `/photos/${photo}`);
        
        console.log(`Total images: ${images.length}`);
        
        if (effect === 'vertical-dual') {
            preloadAndSortImages(() => {
                console.log(`Sorted into ${verticalImages.length} vertical and ${landscapeImages.length} landscape images`);
                createSlides();
                showSlide(0);
                startSlideshow();
                loadingElement.style.display = 'none';
            });
        } else {
            createSlides();
            showSlide(0);
            startSlideshow();
            loadingElement.style.display = 'none';
        }
    }
    
    function preloadAndSortImages(callback) {
        let loadedCount = 0;
        verticalImages = [];
        landscapeImages = [];
        
        if (images.length === 0) {
            console.error("No images to display");
            loadingElement.textContent = "No images found in photos directory";
            return;
        }
        
        console.log("Starting to preload and sort images");
        
        images.forEach(imgSrc => {
            const img = new Image();
            img.onload = function() {
                if (this.height > this.width) {
                    verticalImages.push(imgSrc);
                    console.log(`Vertical image detected: ${imgSrc}`);
                } else {
                    landscapeImages.push(imgSrc);
                    console.log(`Landscape image detected: ${imgSrc}`);
                }
                loadedCount++;
                console.log(`Loaded ${loadedCount}/${images.length} images`);
                if (loadedCount === images.length) {
                    console.log("All images loaded and sorted");
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
    
    function createSlides() {
        slideshowContainer.innerHTML = '';
        
        if (effect === 'vertical-dual') {
            createDualSlides();
        } else {
            createStandardSlides();
        }
    }
    
    function createStandardSlides() {
        console.log("Creating standard slides");
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
    
    function createDualSlides() {
        console.log("Creating dual slides layout");
        // Create slides for landscape images
        landscapeImages.forEach((imgSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            slide.appendChild(imgElement);
            
            slideshowContainer.appendChild(slide);
            console.log(`Created landscape slide ${index+1}/${landscapeImages.length}`);
        });
        
        // Create dual slides for vertical images
        for (let i = 0; i < verticalImages.length; i += 2) {
            const slide = document.createElement('div');
            slide.className = 'slide dual-slide';
            
            const img1 = document.createElement('img');
            img1.src = verticalImages[i];
            img1.className = 'vertical-image';
            slide.appendChild(img1);
            
            if (i + 1 < verticalImages.length) {
                const separator = document.createElement('div');
                separator.className = 'vertical-dual-separator';
                slide.appendChild(separator);
                
                const img2 = document.createElement('img');
                img2.src = verticalImages[i + 1];
                img2.className = 'vertical-image';
                slide.appendChild(img2);
                console.log(`Created dual slide with images: ${verticalImages[i]} and ${verticalImages[i+1]}`);
            } else {
                console.log(`Created dual slide with single image: ${verticalImages[i]}`);
            }
            
            slideshowContainer.appendChild(slide);
        }
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