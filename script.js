/* =========================================================
   CONFIGURATION
   ========================================================= */
const REPO_BASE_URL = 'https://raw.githubusercontent.com/ARSHANONY/Javid-Iranian-names/main';
const DATA_URL = `${REPO_BASE_URL}/data.json`;
const PHOTO_BASE_URL = `${REPO_BASE_URL}/Photo/`;

// NEW FEATURE: Base URL for Music folder
const MUSIC_BASE_URL = `${REPO_BASE_URL}/Music/`;
// IMPORTANT: Add the actual names of your mp3 files here!
const MUSIC_FILES = [
    'track1.mp3', 
    'track2.mp3'
]; 

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" viewBox="0 0 220 280"><rect width="220" height="280" fill="%23e8dec9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%238c7f68">تصویری یافت نشد</text></svg>';

/* =========================================================
   STATE MANAGEMENT
   ========================================================= */
let memorialEntries = [];
let currentIndex = 0;
const CHUNK_SIZE = 5; 
let lastObservedElement = null;

// DOM Elements
const scrollContainer = document.getElementById('scroll-container');
const loaderElement = document.getElementById('loader');
const errorElement = document.getElementById('error-message');

/* NEW FEATURE: App State variables */
let currentAudio = null;
let autoScrollInterval = null;

/* =========================================================
   NEW FEATURE: NAVIGATION & TABS LOGIC
   ========================================================= */
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('hidden');
}

function switchTab(tabId) {
    // 1. Hide all pages
    document.querySelectorAll('.tab-page').forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active-tab');
    });

    // 2. Remove active styling from all nav buttons
    document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.classList.remove('active-nav');
    });

    // 3. Show selected page
    let selectedPage;
    let pageNameForIndicator = "";
    const wrapper = document.getElementById('app-wrapper');
    
    // Clear old background classes
    wrapper.classList.remove('bg-home', 'bg-settings', 'bg-description', 'bg-explore');

    switch(tabId) {
        case 'home':
            selectedPage = document.getElementById('scroll-container');
            document.getElementById('nav-home').classList.add('active-nav');
            wrapper.classList.add('bg-home'); // Change Background
            pageNameForIndicator = "خانه";
            break;
        case 'settings':
            selectedPage = document.getElementById('settings-page');
            document.getElementById('nav-settings').classList.add('active-nav');
            wrapper.classList.add('bg-settings'); // Change Background
            pageNameForIndicator = "تنظیمات";
            break;
        case 'description':
            selectedPage = document.getElementById('description-page');
            document.getElementById('nav-description').classList.add('active-nav');
            wrapper.classList.add('bg-description'); // Change Background
            pageNameForIndicator = "توضیحات";
            break;
        case 'explore':
            selectedPage = document.getElementById('explore-page');
            document.getElementById('nav-explore').classList.add('active-nav');
            wrapper.classList.add('bg-explore'); // Change Background
            pageNameForIndicator = "اکسپلور تاریخ";
            break;
    }

    selectedPage.classList.remove('hidden');
    selectedPage.classList.add('active-tab');

    // Update the visual indicator inside the menu
    document.getElementById('active-indicator').innerText = `وضعیت: ${pageNameForIndicator} (فعال)`;

    // Close menu after selection
    toggleMenu();
}

/* =========================================================
   NEW FEATURE: MUSIC PLAYBACK LOGIC
   ========================================================= */
// This function plays a random file from MUSIC_FILES array
function playRandomMusic() {
    if (MUSIC_FILES.length === 0) return;
    
    // Pick random track
    const randomTrack = MUSIC_FILES[Math.floor(Math.random() * MUSIC_FILES.length)];
    const trackUrl = `${MUSIC_BASE_URL}${randomTrack}`;

    // Create and play audio object
    currentAudio = new Audio(trackUrl);
    currentAudio.loop = true; // Loop the music
    currentAudio.play().catch(e => console.log('Audio autoplay blocked by browser', e));
}

function toggleMusic(checkbox) {
    if (checkbox.checked) {
        // Play music
        playRandomMusic();
    } else {
        // Stop music
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // reset
        }
    }
}

/* =========================================================
   NEW FEATURE: AUTO-SCROLL LOGIC
   ========================================================= */
function toggleAutoScroll(checkbox) {
    if (checkbox.checked) {
        // Start scrolling down every 4 seconds by window height
        autoScrollInterval = setInterval(() => {
            scrollContainer.scrollBy({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }, 4000);
    } else {
        // Stop scrolling
        clearInterval(autoScrollInterval);
    }
}

/* =========================================================
   INITIALIZATION (Existing)
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
   RENDER LOGIC (Existing Infinite Loop)
   ========================================================= */
function renderChunk() {
    for (let i = 0; i < CHUNK_SIZE; i++) {
        if (memorialEntries.length === 0) break;

        const entryIndex = currentIndex % memorialEntries.length;
        const entry = memorialEntries[entryIndex];
        
        const slide = createSlide(entry);
        scrollContainer.appendChild(slide);

        slideObserver.observe(slide);

        if (lastObservedElement) {
            infiniteScrollObserver.unobserve(lastObservedElement);
        }
        lastObservedElement = slide;
        infiniteScrollObserver.observe(lastObservedElement);

        currentIndex++;
    }
}

function toPersianDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, x => persianDigits[x]);
}

function createSlide(entry) {
    const section = document.createElement('section');
    section.className = 'slide';
    
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
   IMAGE LOADING STRATEGY (Existing)
   ========================================================= */
function attemptLoadImage(imgElement, photoName) {
    const spinner = imgElement.previousElementSibling;
    const jpegUrl = `${PHOTO_BASE_URL}${photoName}.jpeg`;
    const jpgUrl  = `${PHOTO_BASE_URL}${photoName}.jpg`;
    const pngUrl  = `${PHOTO_BASE_URL}${photoName}.png`;

    const img = new Image();

    img.onload = () => {
        imgElement.src = img.src;
        imgElement.classList.add('loaded');
        if (spinner) spinner.style.display = 'none';
    };

    img.onerror = () => {
        const img2 = new Image();
        img2.onload = () => {
            imgElement.src = img2.src;
            imgElement.classList.add('loaded');
            if (spinner) spinner.style.display = 'none';
        };
        img2.onerror = () => {
            imgElement.src = FALLBACK_IMAGE;
            imgElement.classList.add('loaded');
            if (spinner) spinner.style.display = 'none';
        };
        img2.src = pngUrl;
    };

    img.src = jpegUrl;
    img.onerror = () => img.src = jpgUrl;
}

/* =========================================================
   OBSERVERS (Existing Lazy Load & Infinite Scroll)
   ========================================================= */
const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const content = entry.target.querySelector('.slide-content');
            content.classList.add('visible');

            const imgEl = entry.target.querySelector('.photo');
            if (imgEl && !imgEl.dataset.loaded) {
                imgEl.dataset.loaded = 'true';
                attemptLoadImage(imgEl, imgEl.dataset.photoName);
            }
        } else {
            const content = entry.target.querySelector('.slide-content');
            content.classList.remove('visible');
        }
    });
}, { threshold: 0.4 }); 

const infiniteScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        renderChunk();
    }
}, { rootMargin: '0px 0px 300px 0px' }); 

/* =========================================================
   START APP
   ========================================================= */
document.addEventListener('DOMContentLoaded', init);
