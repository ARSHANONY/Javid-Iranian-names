/* =========================================================
   CONFIGURATION
   ========================================================= */
const REPO_BASE_URL = 'https://raw.githubusercontent.com/ARSHANONY/Javid-Iranian-names/main';
const DATA_URL = `${REPO_BASE_URL}/data.json`;
const PHOTO_BASE_URL = `${REPO_BASE_URL}/Photo/`;
const MUSIC_FOLDER = `${REPO_BASE_URL}/Music/`;
const MUSIC_FILES = ['track1.mp3','track2.mp3','track3.mp3']; // لیست موزیک‌ها را بر اساس فایل‌های شما آپدیت کنید
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" viewBox="0 0 220 280"><rect width="220" height="280" fill="%23e8dec9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%238c7f68">تصویری یافت نشد</text></svg>';

/* =========================================================
   STATE MANAGEMENT
   ========================================================= */
let memorialEntries = [];
let currentIndex = 0;
const CHUNK_SIZE = 5;
let lastObservedElement = null;
let musicEnabled = false;
let scrollAuto = true;
let currentPage = 'home';
let audio = null;

// DOM Elements
const scrollContainer = document.getElementById('scroll-container');
const loaderElement = document.getElementById('loader');
const errorElement = document.getElementById('error-message');

/* =========================================================
   PAGE & MENU SETUP
   ========================================================= */
const menuButton = document.createElement('div');
menuButton.id = 'menu-button';
menuButton.innerHTML = `<div class="bar green"></div><div class="bar white"></div><div class="bar red"></div>`;
document.body.appendChild(menuButton);

const menuTabs = document.createElement('div');
menuTabs.id = 'menu-tabs';
menuTabs.classList.add('hidden');
menuTabs.innerHTML = `
    <button class="tab-btn" data-page="home">خانه</button>
    <button class="tab-btn" data-page="settings">تنظیمات</button>
    <button class="tab-btn" data-page="description">توضیحات</button>
    <button class="tab-btn" data-page="explore">اکسپلور تاریخ</button>
`;
document.body.appendChild(menuTabs);

// Create pages
const pages = {};
['home','settings','description','explore'].forEach(p => {
    const div = document.createElement('div');
    div.id = `page-${p}`;
    div.className = 'page';
    if (p === 'home') div.classList.add('active');
    document.body.appendChild(div);
    pages[p] = div;
});

/* =========================================================
   INITIALIZATION
   ========================================================= */
async function init() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        memorialEntries = await response.json();
        if (memorialEntries.length === 0) throw new Error('JSON is empty');

        loaderElement.classList.add('hidden');
        scrollContainer.classList.remove('hidden');

        renderChunk();
        setupMenu();
    } catch (error) {
        console.error('Data loading failed:', error);
        loaderElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
    }
}

/* =========================================================
   MENU LOGIC
   ========================================================= */
function setupMenu() {
    menuButton.addEventListener('click', () => {
        menuTabs.classList.toggle('hidden');
        highlightActiveTab();
    });

    const tabButtons = menuTabs.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchPage(btn.dataset.page);
            menuTabs.classList.add('hidden');
        });
    });
}

function switchPage(page) {
    currentPage = page;
    Object.keys(pages).forEach(p => pages[p].classList.remove('active'));
    pages[page].classList.add('active');
    highlightActiveTab();
}

function highlightActiveTab() {
    const tabButtons = menuTabs.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.dataset.page === currentPage) {
            btn.classList.add('active');
            btn.textContent = `${btn.textContent.split(' ')[0]} (صفحه فعال)`;
        } else {
            btn.classList.remove('active');
            btn.textContent = btn.dataset.page === 'home' ? 'خانه' :
                              btn.dataset.page === 'settings' ? 'تنظیمات' :
                              btn.dataset.page === 'description' ? 'توضیحات' :
                              'اکسپلور تاریخ';
        }
    });
}

/* =========================================================
   SETTINGS PAGE
   ========================================================= */
function setupSettings() {
    const settingsHTML = `
        <div class="settings-option">
            <button id="toggle-music">موزیک خاموش/روشن</button>
        </div>
        <div class="settings-option">
            <button id="toggle-scroll">اسکرول اتوماتیک خاموش/روشن</button>
        </div>
    `;
    pages.settings.innerHTML = settingsHTML;

    document.getElementById('toggle-music').addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        if (musicEnabled) playRandomMusic();
        else stopMusic();
    });

    document.getElementById('toggle-scroll').addEventListener('click', () => {
        scrollAuto = !scrollAuto;
        alert(`اسکرول اتوماتیک ${scrollAuto ? 'فعال' : 'غیرفعال'} شد`);
    });
}

/* =========================================================
   DESCRIPTION PAGE
   ========================================================= */
function setupDescription() {
    const descHTML = `
        <div class="description-box">
            <h2>عنوان توضیحات</h2>
            <div class="author">نویسنده: آرشان</div>
            <div class="desc-text">متن توضیحات متوسط...</div>
        </div>
        <div class="social-buttons">
            <div class="social-btn instagram">Instagram</div>
            <div class="social-btn telegram">Telegram</div>
            <div class="social-btn x">X</div>
        </div>
    `;
    pages.description.innerHTML = descHTML;
}

/* =========================================================
   EXPLORE PAGE
   ========================================================= */
function setupExplore() {
    const exploreHTML = `
        <div class="explore-box">
            <h2>اکسپلور تاریخ</h2>
            <p>این صفحه برای نمایش مطالب تاریخی و نمونه‌ها طراحی شده است.</p>
        </div>
    `;
    pages.explore.innerHTML = exploreHTML;
}

/* =========================================================
   MUSIC LOGIC
   ========================================================= */
function playRandomMusic() {
    if (!musicEnabled) return;
    if (audio) audio.pause();

    const track = MUSIC_FILES[Math.floor(Math.random() * MUSIC_FILES.length)];
    audio = new Audio(`${MUSIC_FOLDER}${track}`);
    audio.play();
    audio.onended = () => {
        if (musicEnabled) playRandomMusic();
    };
}

function stopMusic() {
    if (audio) {
        audio.pause();
        audio = null;
    }
}

/* =========================================================
   INFINITE SCROLL LOGIC
   ========================================================= */
function renderChunk() {
    for (let i = 0; i < CHUNK_SIZE; i++) {
        if (memorialEntries.length === 0) break;
        const entryIndex = currentIndex % memorialEntries.length;
        const entry = memorialEntries[entryIndex];
        const slide = createSlide(entry);
        pages.home.appendChild(slide);

        slideObserver.observe(slide);

        if (lastObservedElement) infiniteScrollObserver.unobserve(lastObservedElement);
        lastObservedElement = slide;
        infiniteScrollObserver.observe(lastObservedElement);

        currentIndex++;
    }
}

/* =========================================================
   CREATE SLIDE
   ========================================================= */
function toPersianDigits(str) {
    const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
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
   IMAGE LOADING
   ========================================================= */
function attemptLoadImage(imgElement, photoName) {
    const spinner = imgElement.previousElementSibling;
    const jpegUrl = `${PHOTO_BASE_URL}${photoName}.jpeg`;
    const jpgUrl  = `${PHOTO_BASE_URL}${photoName}.jpg`;
    const pngUrl  = `${PHOTO_BASE_URL}${photoName}.png`;

    const img = new Image();
    img.onload = () => { imgElement.src = img.src; imgElement.classList.add('loaded'); if (spinner) spinner.style.display = 'none'; };
    img.onerror = () => {
        const img2 = new Image();
        img2.onload = () => { imgElement.src = img2.src; imgElement.classList.add('loaded'); if (spinner) spinner.style.display = 'none'; };
        img2.onerror = () => { imgElement.src = FALLBACK_IMAGE; imgElement.classList.add('loaded'); if (spinner) spinner.style.display = 'none'; };
        img2.src = pngUrl;
    };
    img.src = jpegUrl;
    img.onerror = () => img.src = jpgUrl;
}

/* =========================================================
   OBSERVERS
   ========================================================= */
const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const content = entry.target.querySelector('.slide-content');
        if (entry.isIntersecting) {
            content.classList.add('visible');
            const imgEl = entry.target.querySelector('.photo');
            if (imgEl && !imgEl.dataset.loaded) {
                imgEl.dataset.loaded = 'true';
                attemptLoadImage(imgEl, imgEl.dataset.photoName);
            }
        } else { content.classList.remove('visible'); }
    });
}, { threshold: 0.4 });

const infiniteScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) renderChunk();
}, { rootMargin: '0px 0px 300px 0px' });

/* =========================================================
   START APP
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupSettings();
    setupDescription();
    setupExplore();
});
