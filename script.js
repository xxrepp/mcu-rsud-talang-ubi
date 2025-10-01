// Global Variables
let currentPage = 0;
const totalPages = 12;
let isTransitioning = false;
let lastScrollTime = 0;
let scrollAccumulator = 0;
const SCROLL_THRESHOLD = 150; // Pixels needed to trigger page change
let isMusicPlaying = false;
const PAGE_TRANSITION_DELAY = 800; // Time to wait before allowing next page change
let lastPageChangeTime = 0;

// DOM Elements
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = document.getElementById('musicIcon');

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

function initializeWebsite() {
    // Show first page
    showPage(0);
    setupEventListeners();
    setupScrollNavigation();
    setupTouchNavigation();
    setupKeyboardNavigation();
    preventDefaultScrolling();
    setupMusicPlayer();
    
    // Force navigation positioning on mobile
    setTimeout(() => {
        const navigation = document.querySelector('.page-navigation');
        if (navigation && window.innerWidth <= 768) {
            navigation.style.left = '50%';
            navigation.style.transform = 'translateX(-50%)';
        }
    }, 100);
    
    console.log('Medical Check Up Website initialized successfully!');
}

// Setup Music Player
function setupMusicPlayer() {
    if (!backgroundMusic || !musicToggle || !musicIcon) {
        console.warn('Music player elements not found');
        return;
    }
    
    // Set volume (adjust this value between 0.0 and 1.0)
    backgroundMusic.volume = 0.3; // 30% volume
    
    // Try to autoplay immediately
    const attemptAutoplay = () => {
        backgroundMusic.play()
            .then(() => {
                isMusicPlaying = true;
                musicIcon.className = 'fas fa-volume-up';
                musicToggle.classList.remove('muted');
                console.log('Background music autoplayed');
            })
            .catch(err => {
                console.log('Autoplay attempt failed:', err.name);
                // Set up listeners for first user interaction
                setupFirstInteractionPlay();
            });
    };
    
    // Try autoplay after a short delay
    setTimeout(attemptAutoplay, 100);
    
    // Music toggle button
    musicToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMusic();
    });
}

// Setup play on first interaction
function setupFirstInteractionPlay() {
    const events = ['click', 'touchstart', 'keydown', 'wheel', 'touchmove', 'scroll'];
    
    const playOnce = () => {
        if (!isMusicPlaying) {
            backgroundMusic.play()
                .then(() => {
                    isMusicPlaying = true;
                    musicIcon.className = 'fas fa-volume-up';
                    musicToggle.classList.remove('muted');
                    console.log('Background music started on user interaction');
                })
                .catch(err => {
                    console.error('Failed to play music:', err);
                });
            
            // Remove all event listeners
            events.forEach(event => {
                document.removeEventListener(event, playOnce);
            });
        }
    };
    
    // Add listeners for multiple event types including scroll
    events.forEach(event => {
        document.addEventListener(event, playOnce, { once: true, passive: true });
    });
}

function toggleMusic() {
    if (!backgroundMusic) return;
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        isMusicPlaying = false;
        musicIcon.className = 'fas fa-volume-mute';
        musicToggle.classList.add('muted');
        console.log('Music muted');
    } else {
        backgroundMusic.play()
            .then(() => {
                isMusicPlaying = true;
                musicIcon.className = 'fas fa-volume-up';
                musicToggle.classList.remove('muted');
                console.log('Music playing');
            })
            .catch(err => {
                console.error('Failed to play music:', err);
            });
    }
}

// Helper function to try starting music
function tryStartMusic() {
    if (!isMusicPlaying && backgroundMusic) {
        backgroundMusic.play()
            .then(() => {
                isMusicPlaying = true;
                musicIcon.className = 'fas fa-volume-up';
                musicToggle.classList.remove('muted');
                console.log('Background music started on interaction');
            })
            .catch(err => {
                // Silently fail - music will start on next valid interaction
            });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation item clicks
    navItems.forEach((navItem, index) => {
        navItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigation clicked:', index);
            goToPage(index);
        });
        
        navItem.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToPage(index);
            }
        });
    });

    // CTA button click
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('CTA button clicked');
            
            // Try to start music
            tryStartMusic();
            
            // Navigate to next page
            goToPage(1); // Go to MCU Introduction page
        });
    }
}

// Setup Scroll Navigation
function setupScrollNavigation() {
    let scrollTimeout;
    
    // Mouse wheel events with proper targeting and threshold
    document.addEventListener('wheel', function(e) {
        // Try to start music on scroll (before preventing default)
        if (!isMusicPlaying) {
            tryStartMusic();
        }
        
        // Prevent scrolling on opening page (page 0)
        if (currentPage === 0) {
            e.preventDefault();
            return;
        }
        
        // Check if the scroll is happening inside a content card
        const contentElement = e.target.closest('.content');
        
        if (contentElement) {
            // Calculate scroll position
            const scrollTop = contentElement.scrollTop;
            const scrollHeight = contentElement.scrollHeight;
            const clientHeight = contentElement.clientHeight;
            const isAtTop = scrollTop <= 5;
            const isAtBottom = scrollTop >= (scrollHeight - clientHeight - 5);
            
            console.log('Content scroll:', { scrollTop, scrollHeight, clientHeight, isAtTop, isAtBottom });
            
            // If content can still scroll normally, allow it
            if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
                // Reset accumulator when scrolling within content
                scrollAccumulator = 0;
                return;
            }
            
            // At boundary - check if enough time has passed since last page change
            const now = Date.now();
            if (now - lastPageChangeTime < PAGE_TRANSITION_DELAY) {
                console.log('Page transition cooldown active');
                return;
            }
            
            // At boundary - accumulate scroll for threshold
            if ((e.deltaY > 0 && isAtBottom) || (e.deltaY < 0 && isAtTop)) {
                e.preventDefault();
                scrollAccumulator += Math.abs(e.deltaY);
                
                console.log('Scroll accumulator:', scrollAccumulator, 'threshold:', SCROLL_THRESHOLD);
                
                // Check if threshold is reached
                if (scrollAccumulator >= SCROLL_THRESHOLD) {
                    scrollAccumulator = 0; // Reset
                    
                    if (isTransitioning) return;
                    
                    if (now - lastScrollTime < 500) return; // Longer throttle for page changes
                    
                    lastScrollTime = now;
                    
                    if (e.deltaY > 0) {
                        console.log('Threshold reached - next page');
                        nextPage();
                    } else {
                        console.log('Threshold reached - previous page');
                        previousPage();
                    }
                }
                
                // Reset accumulator after timeout
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    scrollAccumulator = 0;
                }, 1000);
                
                return;
            }
        }
        
        // Scrolling outside content - direct page navigation
        e.preventDefault();
        
        if (isTransitioning) return;
        
        // Check page transition cooldown
        const now = Date.now();
        if (now - lastPageChangeTime < PAGE_TRANSITION_DELAY) {
            console.log('Page transition cooldown active');
            return;
        }
        
        if (now - lastScrollTime < 300) return;
        
        lastScrollTime = now;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (e.deltaY > 0) {
                console.log('Direct scroll - next page');
                nextPage();
            } else if (e.deltaY < 0) {
                console.log('Direct scroll - previous page');
                previousPage();
            }
        }, 50);
    }, { passive: false });
}

// Setup Touch Navigation
function setupTouchNavigation() {
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let touchAccumulator = 0;
    
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            touchAccumulator = 0;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        // Check if touch is within content area
        const contentElement = e.target.closest('.content');
        if (!contentElement) {
            e.preventDefault();
            return;
        }
        
        // Allow scrolling within content, but track for threshold
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        
        const scrollTop = contentElement.scrollTop;
        const scrollHeight = contentElement.scrollHeight;
        const clientHeight = contentElement.clientHeight;
        const isAtTop = scrollTop <= 5;
        const isAtBottom = scrollTop >= (scrollHeight - clientHeight - 5);
        
        // At boundary and trying to scroll further
        if ((deltaY > 0 && isAtBottom) || (deltaY < 0 && isAtTop)) {
            touchAccumulator += Math.abs(deltaY);
            if (touchAccumulator > 100) { // Threshold for touch
                e.preventDefault();
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        if (isTransitioning || e.changedTouches.length !== 1) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        // Only process quick swipes (less than 400ms)
        if (touchDuration > 400) return;
        
        touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const minSwipeDistance = 80;
        
        // Check if we're at content boundary and accumulated enough movement
        const contentElement = e.target.closest('.content');
        if (contentElement && Math.abs(deltaY) > minSwipeDistance) {
            const scrollTop = contentElement.scrollTop;
            const scrollHeight = contentElement.scrollHeight;
            const clientHeight = contentElement.clientHeight;
            const isAtTop = scrollTop <= 5;
            const isAtBottom = scrollTop >= (scrollHeight - clientHeight - 5);
            
            if ((deltaY > 0 && isAtBottom) || (deltaY < 0 && isAtTop) || touchAccumulator > 100) {
                if (deltaY > 0) {
                    console.log('Touch swipe - next page');
                    nextPage();
                } else {
                    console.log('Touch swipe - previous page');
                    previousPage();
                }
                return;
            }
        }
        
        // Regular swipe outside content
        if (!contentElement && Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                console.log('Direct touch swipe - next page');
                nextPage();
            } else {
                console.log('Direct touch swipe - previous page');
                previousPage();
            }
        }
    }, { passive: true });
}

// Setup Keyboard Navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (isTransitioning) return;
        
        // Don't intercept if user is typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                previousPage();
                break;
            case 'ArrowDown':
            case 'ArrowRight':
            case ' ': // Spacebar
                e.preventDefault();
                nextPage();
                break;
            case 'Home':
                e.preventDefault();
                goToPage(0);
                break;
            case 'End':
                e.preventDefault();
                goToPage(totalPages - 1);
                break;
        }
    });
}

// Navigation Functions
function goToPage(pageIndex) {
    console.log('goToPage called:', pageIndex, 'current:', currentPage);
    
    if (isTransitioning || pageIndex === currentPage || pageIndex < 0 || pageIndex >= totalPages) {
        console.log('Navigation blocked:', { isTransitioning, pageIndex, currentPage, totalPages });
        return;
    }
    
    isTransitioning = true;
    lastPageChangeTime = Date.now(); // Track page change time
    console.log('Navigating to page:', pageIndex);
    
    // Hide current page
    if (pages[currentPage]) {
        pages[currentPage].classList.remove('active');
    }
    
    // Update current page
    const previousPage = currentPage;
    currentPage = pageIndex;
    
    // Show new page immediately
    showPage(currentPage);
    
    // Update navigation
    updateNavigation();
    
    // Reset transition lock after animation
    setTimeout(() => {
        isTransitioning = false;
        console.log('Navigation unlocked');
    }, 300);
    
    // Track page view
    trackPageView(currentPage);
}

function showPage(pageIndex) {
    console.log('Showing page:', pageIndex);
    
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show target page
    if (pages[pageIndex]) {
        pages[pageIndex].style.display = 'flex';
        setTimeout(() => {
            pages[pageIndex].classList.add('active');
        }, 50);
    }
}

function nextPage() {
    console.log('nextPage called, current:', currentPage);
    if (currentPage < totalPages - 1) {
        goToPage(currentPage + 1);
    } else {
        console.log('Already at last page');
    }
}

function previousPage() {
    console.log('previousPage called, current:', currentPage);
    if (currentPage > 0) {
        goToPage(currentPage - 1);
    } else {
        console.log('Already at first page');
    }
}

// Update Navigation Display
function updateNavigation() {
    navItems.forEach((navItem, index) => {
        if (index === currentPage) {
            navItem.classList.add('active');
            
            // Scroll navigation to show active item (mobile)
            if (window.innerWidth <= 768) {
                scrollNavigationToActive(navItem);
            }
        } else {
            navItem.classList.remove('active');
        }
    });
    
    // Ensure navigation stays properly positioned on mobile
    const navigation = document.querySelector('.page-navigation');
    if (navigation && window.innerWidth <= 768) {
        // Reset any inline styles that might have been applied
        navigation.style.left = '50%';
        navigation.style.transform = 'translateX(-50%)';
    }
}

// Scroll navigation to show active item
function scrollNavigationToActive(activeItem) {
    const navigation = document.querySelector('.page-navigation');
    if (!navigation || !activeItem) return;
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        const navScrollLeft = navigation.scrollLeft;
        const navOffsetWidth = navigation.offsetWidth;
        const itemOffsetLeft = activeItem.offsetLeft;
        const itemOffsetWidth = activeItem.offsetWidth;
        
        // Calculate position to center the active item
        const scrollTo = itemOffsetLeft - (navOffsetWidth / 2) + (itemOffsetWidth / 2);
        
        console.log('Scrolling navigation:', { 
            navScrollLeft, 
            navOffsetWidth, 
            itemOffsetLeft, 
            itemOffsetWidth, 
            scrollTo 
        });
        
        // Smooth scroll to the calculated position
        navigation.scrollTo({
            left: scrollTo,
            behavior: 'smooth'
        });
    });
}

// Prevent Default Scrolling
function preventDefaultScrolling() {
    // Prevent window scrolling
    window.addEventListener('scroll', function(e) {
        window.scrollTo(0, 0);
    });
    
    // Set body overflow
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent default scroll behavior
    document.addEventListener('touchmove', function(e) {
        const target = e.target.closest('.content');
        if (!target) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Utility Functions
function trackPageView(pageIndex) {
    const pageNames = [
        'Opening',
        'MCU Introduction',
        'MCU Sederhana',
        'MCU Sedang',
        'MCU Lengkap',
        'Pemeriksaan Mata',
        'Spirometri',
        'Narkoba',
        'Treadmill',
        'Profile',
        'Maps',
        'Contact'
    ];
    
    console.log(`Page viewed: ${pageNames[pageIndex]} (${pageIndex + 1}/${totalPages})`);
}

// Handle window events
window.addEventListener('load', function() {
    console.log('Window loaded');
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    showPage(0);
});

window.addEventListener('resize', function() {
    setTimeout(() => {
        updateNavigation();
    }, 100);
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Auto-hide navigation on mobile inactivity
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    if (window.innerWidth <= 768) {
        const navigation = document.querySelector('.page-navigation');
        
        if (navigation) {
            navigation.style.opacity = '1';
            navigation.style.transform = 'translateX(-50%) translateY(0)';
            
            inactivityTimer = setTimeout(() => {
                navigation.style.opacity = '0.8';
            }, 5000);
        }
    }
}

// Reset timer on user activity
['mousedown', 'mousemove', 'keypress', 'touchstart', 'wheel'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
});

resetInactivityTimer();

// Accessibility improvements
function setupAccessibility() {
    navItems.forEach((navItem, index) => {
        const pageNames = [
            'Opening page',
            'MCU Introduction',
            'Paket MCU Sederhana',
            'Paket MCU Sedang',
            'Paket MCU Lengkap',
            'Paket Pemeriksaan Mata',
            'Paket Pemeriksaan Spirometri',
            'Paket Pemeriksaan Narkoba',
            'Paket Pemeriksaan Treadmill',
            'Profile RSUD',
            'Location Map',
            'Contact Information'
        ];
        
        navItem.setAttribute('aria-label', `Go to ${pageNames[index]}`);
        navItem.setAttribute('role', 'button');
        navItem.setAttribute('tabindex', '0');
    });
}

setupAccessibility();

// Make functions globally available
window.nextPage = nextPage;
window.previousPage = previousPage;
window.goToPage = goToPage;

// Debug info
console.log('Available functions:', { nextPage, previousPage, goToPage });
console.log('Total pages:', totalPages);
console.log('Pages found:', pages.length);
console.log('Nav items found:', navItems.length);