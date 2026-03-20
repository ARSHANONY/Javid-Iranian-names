/* =========================================================
   CONFIGURATION
   Replace the USERNAME and REPO to match your GitHub project
   ========================================================= */
const REPO_BASE_URL = 'https://raw.githubusercontent.com/ARSHANONY/Javid-Iranian-names/main';
const DATA_URL = `${REPO_BASE_URL}/data.json`;
const PHOTO_BASE_URL = `${REPO_BASE_URL}/Photo/`;

// Fallback image in case both JPG and PNG fail (Base64 SVG to avoid external requests)
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" viewBox="0 0 220 280"><rect width="220" height="280" fill="%23e8dec9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%238c7f68">تصویری یافت نشد</text></svg>';

/* =========================================================
   STATE MANAGEMENT
   ========================================================= */
let memorialEntries = [];
let currentIndex = 0;
const CHUNK_SIZE = 5; // Number of entries to load at a time
let lastObservedElement = null;

// DOM Elements
const scrollContainer = document.getElementById('scroll-container');
const loaderElement = document.getElementById('loader');
const errorElement = document.getElementById('error-message');

/* =========================================================
   INITIALIZATION
   ========================================================= */
async function init() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        memorialEntries = await response.json();
        
        if (memorialEntries.length === 0) {
            throw new Error('JSON is empty');
        }

        // Hide loader, show container
        loaderElement.classList.add('hidden');
        scrollContainer.classList.remove('hidden');

        // Initial render
        renderChunk();
        
    } catch (error) {
        console.error('Data loading failed:', error);
        loaderElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
    }
}

/* =========================================================
   RENDER LOGIC (Infinite Loop)
   ========================================================= */
function renderChunk() {
    for (let i = 0; i < CHUNK_SIZE; i++) {
        if (memorialEntries.length === 0) break;

        // Loop array safely to enable infinite scrolling
        const entryIndex = currentIndex % memorialEntries.length;
        const entry = memorialEntries[entryIndex];
        
        const slide = createSlide(entry);
        scrollContainer.appendChild(slide);

        // Observe slide for fade-in animations and lazy loading
        slideObserver.observe(slide);

        // Update Infinite Scroll Observer to the newest last element
        if (lastObservedElement) {
            infiniteScrollObserver.unobserve(lastObservedElement);
        }
        lastObservedElement = slide;
        infiniteScrollObserver.observe(lastObservedElement);

        currentIndex++;
    }
}

// Convert English numbers to Persian numerically
function toPersianDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, x => persianDigits[x]);
}

function createSlide(entry) {
    const section = document.createElement('section');
    section.className = 'slide';
    
    // HTML Structure
    section.innerHTML = `
        <div class="slide-content">
            <div class="photo-frame">
                <div class="img-spinner"></div>
                <img class="photo" data-photo-name="${entry.photo}" alt="تصویر ${entry.name}">
            </div>
            <h2 class="name">${entry.name}</h2>
            <p class="details"><strong>سن:</strong> ${toPersianDigits(entry.age)} سال</p>
            <p class="details"><strong>شهر:</strong> ${entry.city}</p>
            <p class="details"><strong>تاریخ:</strong> ${toPersianDigits(entry.date)}</p>
            
            <div class="btn-container">
                <a href="${entry.media_link}" target="_blank" rel="noopener noreferrer" class="media-btn">آخرین تصاویر و ویدیو</a>
            </div>
        </div>
    `;
    return section;
}

/* =========================================================
   IMAGE LOADING STRATEGY (.jpg -> .png -> fallback)
   ========================================================= */
function attemptLoadImage(imgElement, photoName) {
    const spinner = imgElement.previousElementSibling;
    const jpgUrl = `${PHOTO_BASE_URL}${photoName}.jpg`;
    const pngUrl = `${PHOTO_BASE_URL}${photoName}.png`;

    const img = new Image();

    // 1. Try JPG
    img.onload = () => {
        imgElement.src = jpgUrl;
        imgElement.classList.add('loaded');
        if (spinner) spinner.style.display = 'none';
    };

    img.onerror = () => {
        // 2. Try PNG on JPG fail
        const imgPng = new Image();
        imgPng.onload = () => {
            imgElement.src = pngUrl;
            imgElement.classList.add('loaded');
            if (spinner) spinner.style.display = 'none';
        };
        
        imgPng.onerror = () => {
            // 3. Fallback on PNG fail
            imgElement.src = FALLBACK_IMAGE;
            imgElement.classList.add('loaded');
            if (spinner) spinner.style.display = 'none';
        };
        
        imgPng.src = pngUrl; // Trigger PNG load
    };

    img.src = jpgUrl; // Trigger JPG load
}

/* =========================================================
   OBSERVERS (Lazy Load & Infinite Scroll)
   ========================================================= */
   
// Observer 1: Slide Animations and Lazy Image Loading
const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Fade & Slide up animation
            const content = entry.target.querySelector('.slide-content');
            content.classList.add('visible');

            // Lazy load image if not loaded yet
            const imgEl = entry.target.querySelector('.photo');
            if (imgEl && !imgEl.dataset.loaded) {
                imgEl.dataset.loaded = 'true'; // Mark as touched
                attemptLoadImage(imgEl, imgEl.dataset.photoName);
            }
        } else {
            // Optional: reset animation when scrolled out to repeat animation on scroll back
            const content = entry.target.querySelector('.slide-content');
            content.classList.remove('visible');
        }
    });
}, { threshold: 0.4 }); // Trigger when 40% of the slide is visible

// Observer 2: Infinite Scroll trigger
const infiniteScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        // User reached the last loaded chunk, load next chunk
        renderChunk();
    }
}, { rootMargin: '0px 0px 300px 0px' }); // Trigger 300px before reaching the end

/* =========================================================
   START APP
   ========================================================= */
document.addEventListener('DOMContentLoaded', init);
