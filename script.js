/* ============================================================
   THE LONG LOOK — script.js
   A personal art practice, one work at a time.
   ============================================================ */

/* ---------- CONFIG ---------- */
const AIC_SEARCH = 'https://api.artic.edu/api/v1/artworks/search';
const AIC_IIIF   = 'https://www.artic.edu/iiif/2/';
const CMA_SEARCH = 'https://openaccess-api.clevelandart.org/api/artworks/';
const FIELDS     = 'id,title,image_id,artist_display,date_display,medium_display';

/* ---------- EmailJS ----------
   publicKey   — your key (already filled in)
   serviceId   — get this from EmailJS → Email Services
   templateId  — get this from EmailJS → Email Templates
-------------------------------- */
const EMAILJS = {
    publicKey:  'cIeRGuB2mD_8X6NQD',
    serviceId:  'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID'
};

/* Initialise EmailJS once, as soon as the library loads */
(function initEmailJS() {
    if (window.emailjs && EMAILJS.publicKey && EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY') {
        try {
            emailjs.init({ publicKey: EMAILJS.publicKey });
            console.info('[The Long Look] EmailJS initialised.');
        } catch (err) {
            console.warn('[The Long Look] EmailJS init failed.', err);
        }
    } else {
        console.info('[The Long Look] EmailJS not ready — waiting for DOMContentLoaded.');
    }
})();

const STORAGE_KEY = 'll_reminders_v1';

/* ---------- VARIATIONS ---------- */
const WORKSHOPS = [
    {
        key: 'watercolor',
        name: 'Watercolor Landscapes',
        query: 'watercolor landscape',
        tag: 'Wet media',
        blurb: 'Washes, wet-on-wet skies, and the discipline of leaving paper alone.',
        focus: 'Washes & negative space',
        duration: '45 min sitting',
        level: 'All levels',
        swatch: 'linear-gradient(135deg, #cfe3ea, #7fa9b8 55%, #4a7285)',
        materials: [
            'Cold-press watercolor block, 300gsm',
            'Round brushes: sizes 6, 10, 14',
            'Ultramarine, burnt sienna, raw umber, sap green',
            'Two jars of clean water',
            'Cotton rag',
            'Masking tape and a rigid board'
        ]
    },
    {
        key: 'portrait',
        name: 'Oil Portraiture',
        query: 'portrait',
        tag: 'Figure',
        blurb: 'Structure under the skin — planes, value, and the patience of a slow build.',
        focus: 'Value & structure',
        duration: '60 min sitting',
        level: 'Intermediate',
        swatch: 'linear-gradient(135deg, #e8d3bd, #b98a63 55%, #6d4530)',
        materials: [
            'Oil-primed canvas board, 20×25cm',
            'Bristle filberts: sizes 2, 6, 10',
            'Titanium white, yellow ochre, burnt sienna, ivory black',
            'Low-odour solvent or safflower oil',
            'Palette knife',
            'Rags and a small palette'
        ]
    },
    {
        key: 'charcoal',
        name: 'Charcoal Sketching',
        query: 'charcoal',
        tag: 'Dry media',
        blurb: 'Value first, edges second. The fastest way to find out what you actually see.',
        focus: 'Seeing & rendering',
        duration: '35 min sitting',
        level: 'Beginner',
        swatch: 'linear-gradient(135deg, #d6d6d6, #7c7c7c 55%, #2b2b2b)',
        materials: [
            'Willow charcoal, thick and thin',
            'Compressed charcoal sticks',
            'Kneaded eraser and a hard eraser',
            'Rough newsprint or Ingres paper, A3',
            'Sandpaper block for sharpening',
            'Fixative spray'
        ]
    },
    {
        key: 'abstract',
        name: 'Acrylic Abstract',
        query: 'abstract',
        tag: 'Colour',
        blurb: 'Composition without a subject. Shape, weight, and the argument between colours.',
        focus: 'Colour & composition',
        duration: '40 min sitting',
        level: 'All levels',
        swatch: 'linear-gradient(135deg, #f2c4a0, #c96b4a 45%, #4a3f8f)',
        materials: [
            'Acrylic paint: cad red, cad yellow, ultramarine, titanium white, black',
            'Flat brushes: 1", 1/2"',
            'Canvas panel or gessoed board, 30×30cm',
            'Palette knife for texture',
            'Water pot and rags',
            'Painter\'s tape'
        ]
    },
    {
        key: 'printmaking',
        name: 'Printmaking',
        query: 'woodblock print',
        tag: 'Relief',
        blurb: 'Carve away everything that isn\'t the image. What\'s left is the print.',
        focus: 'Carving & line',
        duration: '50 min sitting',
        level: 'Intermediate',
        swatch: 'linear-gradient(135deg, #e3d3b8, #a8894f 50%, #3c3226)',
        materials: [
            'Shina plywood block, 15×20cm',
            'U and V gouges, sizes 3 and 6',
            'Water-based block printing ink, black',
            'Brayer (roller), 10cm',
            'Baren or wooden spoon',
            'Japanese paper, 40gsm'
        ]
    },
    {
        key: 'figure',
        name: 'Life Drawing',
        query: 'figure drawing',
        tag: 'Gesture',
        blurb: 'Thirty seconds to catch a whole body. Then thirty more, and thirty more.',
        focus: 'Gesture & weight',
        duration: '30 min sitting',
        level: 'All levels',
        swatch: 'linear-gradient(135deg, #ecdcc9, #c49a78 55%, #7a5540)',
        materials: [
            'Vine charcoal and conte crayon',
            'Cartridge paper, A2, several sheets',
            'Drawing board and clips',
            'Putty eraser',
            'Chamois or cloth for blending',
            'A timer (for gesture rounds)'
        ]
    }
];

/* ---------- DOM HELPERS ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function workshopByKey(key) {
    return WORKSHOPS.find(w => w.key === key) || WORKSHOPS[0];
}

/* ============================================================
   MATERIAL ICONS
   ============================================================ */
const MATERIAL_ICONS = {
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/><circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/></svg>',
    paper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    cloth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16a2 2 0 0 1 0-2.83l10.59-10.58a2 2 0 0 1 2.83 0l5.66 5.66a2 2 0 0 1 0 2.83L13 20"/><path d="M7 20l-4-4"/></svg>',
    knife: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2.5l7 7-9.5 9.5-7-7z"/><path d="M5 19l-3 3"/></svg>',
    roller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="6" rx="1"/><path d="M12 9v3"/><rect x="9" y="12" width="6" height="3" rx="1"/><path d="M12 15v7"/></svg>',
    tray: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    easel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21l5-9 5 9M4 7h16"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>'
};

function materialIcon(text) {
    const t = String(text || '').toLowerCase();
    if (/\bbrush|filbert|round brush|flat brush|sable/.test(t)) return MATERIAL_ICONS.brush;
    if (/\bpaint|pigment|colour|color|ink|ultramarine|ochre|sienna|umber|titanium|cad|white|black|red|yellow|green|blue/.test(t)) return MATERIAL_ICONS.palette;
    if (/\bcanvas|paper|newsprint|cartridge|ingres|board|block|gsm|gessoed|panel/.test(t)) return MATERIAL_ICONS.paper;
    if (/\bcharcoal|pencil|crayon|conte|graphite|vine/.test(t)) return MATERIAL_ICONS.pencil;
    if (/\bwater|jar|pot|solvent|oil|spray|fixative|medium|safflower|odour|low-odour/.test(t)) return MATERIAL_ICONS.droplet;
    if (/\brag|cloth|chamois|towel|apron|smock/.test(t)) return MATERIAL_ICONS.cloth;
    if (/\btape|clip|pin|masking/.test(t)) return MATERIAL_ICONS.clip;
    if (/\beraser|putty|kneaded/.test(t)) return MATERIAL_ICONS.eraser;
    if (/\bknife|gouge|blade|scalpel|palette knife/.test(t)) return MATERIAL_ICONS.knife;
    if (/\broller|brayer|baren|spoon/.test(t)) return MATERIAL_ICONS.roller;
    if (/\bpalette\b|tray|dish/.test(t)) return MATERIAL_ICONS.tray;
    if (/\btimer|clock|watch/.test(t)) return MATERIAL_ICONS.timer;
    if (/\beasel|stand/.test(t)) return MATERIAL_ICONS.easel;
    return MATERIAL_ICONS.dot;
}

/* ============================================================
   ART APIs — Cleveland first, AIC fallback
   ============================================================ */
async function searchCMA(query, limit = 10) {
    const url = `${CMA_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&has_image=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`CMA search failed (${res.status})`);
    const json = await res.json();
    return (json.data || []).filter(
        c => c.images && c.images.web && c.images.web.url
    );
}

function cmaCreditLine(c) {
    const creator = c.creators && c.creators[0] ? c.creators[0].description : '';
    const bits = [creator, c.creation_date, c.type]
        .filter(Boolean)
        .map(s => String(s).trim());
    return bits.join(' · ');
}

async function searchAIC(query, limit = 10) {
    const url = `${AIC_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`AIC search failed (${res.status})`);
    const json = await res.json();
    return (json.data || []).filter(a => a && a.image_id);
}

function aicImageUrl(imageId, width = 843) {
    return `${AIC_IIIF}${imageId}/full/${width},/0/default.jpg`;
}

function aicCreditLine(a) {
    const artist = (a.artist_display || '').replace(/\s*\n\s*/g, ', ').trim();
    const bits = [artist, a.date_display, a.medium_display]
        .filter(Boolean)
        .map(s => String(s).trim());
    return bits.join(' · ');
}

async function fetchArtwork(query) {
    try {
        const results = await searchCMA(query, 10);
        if (results.length) {
            const pick = results[Math.floor(Math.random() * results.length)];
            return {
                source: 'cma',
                title: pick.title || 'Untitled',
                credit: cmaCreditLine(pick),
                image: pick.images.web.url
            };
        }
    } catch (err) {
        console.warn('CMA search failed, trying AIC.', err);
    }

    try {
        const results = await searchAIC(query, 10);
        if (results.length) {
            const pick = results[Math.floor(Math.random() * results.length)];
            return {
                source: 'aic',
                title: pick.title || 'Untitled',
                credit: aicCreditLine(pick),
                image: aicImageUrl(pick.image_id, 843)
            };
        }
    } catch (err) {
        console.warn('AIC fallback failed too.', err);
    }

    throw new Error('No works found from either source');
}

/* ---------- IMAGE LOADING ---------- */
function loadInto(mediaEl, imgEl, url, alt) {
    return new Promise((resolve, reject) => {
        if (!mediaEl || !imgEl) return reject(new Error('Missing elements'));
        mediaEl.classList.remove('is-error');
        mediaEl.classList.add('is-loading');
        imgEl.classList.remove('is-ready');

        const pre = new Image();
        pre.onload = () => {
            imgEl.src = url;
            imgEl.alt = alt || '';
            mediaEl.classList.remove('is-loading');
            requestAnimationFrame(() => imgEl.classList.add('is-ready'));
            resolve();
        };
        pre.onerror = () => {
            mediaEl.classList.remove('is-loading');
            mediaEl.classList.add('is-error');
            reject(new Error('Image failed to load'));
        };
        pre.src = url;

        setTimeout(() => {
            if (!pre.complete) {
                pre.src = '';
                mediaEl.classList.remove('is-loading');
                reject(new Error('Image timed out'));
            }
        }, 12000);
    });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNav() {
    const toggle = $('.nav-toggle');
    const nav = $('#siteNav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
        });

        $$('#siteNav a').forEach(a => {
            a.addEventListener('click', () => {
                nav.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const page = document.body.dataset.page;
    $$('#siteNav a[data-nav]').forEach(a => {
        if (a.dataset.nav === page) a.classList.add('is-active');
    });
}

/* ============================================================
   HOME PAGE
   ============================================================ */
function initHome() {
    initHeroRotation();
    initTodayInspiration();
    renderWorkshopGrid();
    initLightbox();
}

async function buildHeroPool() {
    try {
        const cma = await searchCMA('painting', 15);
        if (cma.length) {
            return cma.map(c => ({
                title: c.title || 'Untitled',
                credit: cmaCreditLine(c),
                image: c.images.web.url
            }));
        }
    } catch (e) {
        console.warn('CMA hero pool failed, trying AIC.', e);
    }

    try {
        const aic = await searchAIC('painting', 15);
        if (aic.length) {
            return aic.map(a => ({
                title: a.title || 'Untitled',
                credit: aicCreditLine(a),
                image: aicImageUrl(a.image_id, 1000)
            }));
        }
    } catch (e) {
        console.warn('AIC hero pool failed too.', e);
    }

    return [];
}

async function initHeroRotation() {
    const media = $('#heroMedia');
    const img = $('#heroImage');
    const titleEl = $('.art-caption__title');
    const metaEl = $('.art-caption__meta');

    if (!media || !img) return;

    const pool = await buildHeroPool();

    if (!pool.length) {
        titleEl.textContent = 'Archive unavailable';
        metaEl.textContent = 'Check your connection and refresh.';
        return;
    }

    let index = 0;

    const show = async (artwork, fade) => {
        if (fade) {
            img.classList.remove('is-ready');
            await new Promise(r => setTimeout(r, 420));
        }
        try {
            await loadInto(media, img, artwork.image, artwork.title);
            titleEl.textContent = artwork.title;
            metaEl.textContent = artwork.credit;
            return true;
        } catch (err) {
            return false;
        }
    };

    let tries = 0;
    while (tries < pool.length && !(await show(pool[index], false))) {
        index = (index + 1) % pool.length;
        tries++;
    }

    setInterval(async () => {
        let attempts = 0;
        let shown = false;
        while (attempts < pool.length && !shown) {
            index = (index + 1) % pool.length;
            shown = await show(pool[index], true);
            attempts++;
        }
    }, 7000);
}

async function initTodayInspiration() {
    const media = $('#todayMedia');
    const img = $('#todayImage');
    const titleEl = $('#todayTitle');
    const metaEl = $('#todayMeta');
    const refreshBtn = $('#todayRefresh');

    if (!media) return;

    async function load() {
        titleEl.textContent = 'Fetching a work…';
        metaEl.textContent = '';
        if (refreshBtn) refreshBtn.classList.add('is-loading');

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const art = await fetchArtwork('painting');
                await loadInto(media, img, art.image, art.title);
                titleEl.textContent = art.title;
                metaEl.textContent = art.credit;
                if (refreshBtn) refreshBtn.classList.remove('is-loading');
                return;
            } catch (err) {
                console.warn(`Today attempt ${attempt + 1} failed.`, err);
            }
        }

        titleEl.textContent = 'Could not reach the archive';
        metaEl.textContent = 'Please try again in a moment.';
        if (refreshBtn) refreshBtn.classList.remove('is-loading');
    }

    load();
    if (refreshBtn) refreshBtn.addEventListener('click', load);
}

function renderWorkshopGrid() {
    const grid = $('#workshopGrid');
    if (!grid) return;

    grid.innerHTML = WORKSHOPS.map(w => `
    <article class="wcard" data-key="${escapeHtml(w.key)}">
      <div class="wcard__swatch" style="--swatch:${w.swatch}">
        <span class="wcard__tag">${escapeHtml(w.tag)}</span>
      </div>

      <div class="wcard__body">
        <h3>${escapeHtml(w.name)}</h3>
        <p class="wcard__blurb">${escapeHtml(w.blurb)}</p>

        <ul class="wcard__facts">
          <li><span>Focus</span><strong>${escapeHtml(w.focus)}</strong></li>
          <li><span>Suggested sitting</span><strong>${escapeHtml(w.duration)}</strong></li>
          <li><span>Level</span><strong>${escapeHtml(w.level)}</strong></li>
        </ul>

        <div class="wcard__actions">
          <button class="btn btn--ghost btn--sm" type="button" data-action="inspire" data-key="${escapeHtml(w.key)}">
            See Inspiration
          </button>
          <a class="btn btn--primary btn--sm" href="schedule.html?workshop=${encodeURIComponent(w.key)}">
            Set Reminder
          </a>
        </div>
      </div>
    </article>
  `).join('');

    $$('[data-action="inspire"]', grid).forEach(btn => {
        btn.addEventListener('click', () => openLightbox(btn.dataset.key));
    });
}

let lightboxEl, lbMedia, lbImg, lbTitle, lbMeta, lbWorkshop, lbRegister, lbSpinner, lastFocus;

function initLightbox() {
    lightboxEl  = $('#lightbox');
    if (!lightboxEl) return;

    lbMedia     = $('.lightbox__frame');
    lbImg       = $('#lbImage');
    lbTitle     = $('#lbTitle');
    lbMeta      = $('#lbMeta');
    lbWorkshop  = $('#lbWorkshop');
    lbRegister  = $('#lbRegister');
    lbSpinner   = $('#lbSpinner');

    $$('[data-close]', lightboxEl).forEach(el => {
        el.addEventListener('click', closeLightbox);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !lightboxEl.hidden) closeLightbox();
    });
}

async function openLightbox(key) {
    const w = workshopByKey(key);
    if (!lightboxEl) return;

    lastFocus = document.activeElement;

    lightboxEl.hidden = false;
    document.body.style.overflow = 'hidden';

    lbWorkshop.textContent = w.name;
    lbTitle.textContent = 'Finding a work…';
    lbMeta.textContent = '';
    lbImg.classList.remove('is-ready');
    lbImg.removeAttribute('src');
    if (lbSpinner) lbSpinner.style.display = 'block';
    lbRegister.href = `schedule.html?workshop=${encodeURIComponent(w.key)}`;
    lbRegister.textContent = `Remind me of a ${w.name.toLowerCase()} work`;

    const closeBtn = $('.lightbox__close', lightboxEl);
    if (closeBtn) closeBtn.focus();

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const art = await fetchArtwork(w.query);
            await loadInto(lbMedia, lbImg, art.image, art.title);
            lbTitle.textContent = art.title;
            lbMeta.textContent = art.credit;
            if (lbSpinner) lbSpinner.style.display = 'none';
            return;
        } catch (err) {
            console.warn(`Lightbox attempt ${attempt + 1} failed.`, err);
        }
    }

    lbTitle.textContent = 'Could not load a work';
    lbMeta.textContent = 'Please try again in a moment.';
    if (lbSpinner) lbSpinner.style.display = 'none';
}

function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* ============================================================
   SCHEDULE PAGE
   ============================================================ */
let currentWorkshopKey = WORKSHOPS[0].key;
let setupState = { defaults: [], custom: [] };

function initSchedule() {
    const form = $('#scheduleForm');
    if (!form) return;

    const workshopSelect = $('#workshop');
    const dateInput = $('#sessionDate');
    const timeInput = $('#sessionTime');

    workshopSelect.innerHTML =
        '<option value="">Select a variation…</option>' +
        WORKSHOPS.map(w => `<option value="${escapeHtml(w.key)}">${escapeHtml(w.name)}</option>`).join('');

    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('workshop');
    if (preselect && workshopByKey(preselect)) {
        workshopSelect.value = preselect;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
        if (!dateInput.value) dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    currentWorkshopKey = workshopSelect.value || WORKSHOPS[0].key;
    loadMaterialsForWorkshop(currentWorkshopKey);
    updatePreviewVariation(currentWorkshopKey);

    workshopSelect.addEventListener('change', () => {
        currentWorkshopKey = workshopSelect.value || WORKSHOPS[0].key;
        loadMaterialsForWorkshop(currentWorkshopKey);
        updatePreviewVariation(currentWorkshopKey);
    });

    const addBtn = $('#addMaterialBtn');
    const customInput = $('#customMaterialInput');
    if (addBtn && customInput) {
        addBtn.addEventListener('click', () => {
            const val = customInput.value.trim();
            if (!val) return;
            setupState.custom.push({ text: val });
            customInput.value = '';
            renderMaterialsEditor();
            updatePreviewMaterials();
            customInput.focus();
        });
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addBtn.click();
            }
        });
    }

    $$('input, select, textarea', form).forEach(el => {
        const evt = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(evt, () => clearFieldError(el));
    });

    form.addEventListener('submit', handleSubmit);

    const resetBtn = $('#resetFormBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            $('#formMessage').hidden = true;
            form.hidden = false;
            form.reset();
            if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
            if (timeInput) timeInput.value = '09:00';
            currentWorkshopKey = WORKSHOPS[0].key;
            loadMaterialsForWorkshop(currentWorkshopKey);
            updatePreviewVariation(currentWorkshopKey);
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    renderDashboard();
}

function loadMaterialsForWorkshop(key) {
    const w = workshopByKey(key);
    setupState = {
        defaults: w.materials.map(text => ({ text, checked: true })),
        custom: []
    };
    renderMaterialsEditor();
    updatePreviewMaterials();
}

function renderMaterialsEditor() {
    const list = $('#materialsEditor');
    if (!list) return;

    let html = '';

    setupState.defaults.forEach((d, i) => {
        html += `
      <li class="materials-editor__item">
        <label>
          <input type="checkbox" data-default-index="${i}" ${d.checked ? 'checked' : ''}>
          <span class="materials-editor__icon" aria-hidden="true">${materialIcon(d.text)}</span>
          <span class="materials-editor__text">${escapeHtml(d.text)}</span>
        </label>
      </li>
    `;
    });

    setupState.custom.forEach((c, i) => {
        html += `
      <li class="materials-editor__item materials-editor__item--custom">
        <span class="materials-editor__icon" aria-hidden="true">${materialIcon(c.text)}</span>
        <span class="materials-editor__text">${escapeHtml(c.text)}</span>
        <button type="button" class="materials-editor__remove" data-custom-index="${i}" aria-label="Remove this item">&times;</button>
      </li>
    `;
    });

    if (!html) {
        html = `<li class="materials-editor__item materials-editor__item--empty" style="justify-content:center;color:var(--muted);font-style:italic;font-size:.84rem;">No items yet — add your own below.</li>`;
    }

    list.innerHTML = html;

    $$('input[type="checkbox"][data-default-index]', list).forEach(cb => {
        cb.addEventListener('change', () => {
            const idx = Number(cb.dataset.defaultIndex);
            setupState.defaults[idx].checked = cb.checked;
            updatePreviewMaterials();
        });
    });

    $$('[data-custom-index]', list).forEach(btn => {
        btn.addEventListener('click', () => {
            setupState.custom.splice(Number(btn.dataset.customIndex), 1);
            renderMaterialsEditor();
            updatePreviewMaterials();
        });
    });
}

function getFinalMaterials() {
    const defs = setupState.defaults.filter(d => d.checked).map(d => ({ text: d.text, custom: false }));
    const cust = setupState.custom.map(c => ({ text: c.text, custom: true }));
    return [...defs, ...cust];
}

function updatePreviewMaterials() {
    const list = $('#previewMaterials');
    if (!list) return;

    const items = getFinalMaterials();

    if (!items.length) {
        list.innerHTML = `<li class="checklist__empty">No materials listed yet. Add them in the form.</li>`;
        return;
    }

    list.innerHTML = items.map(m => `
    <li>
      <span class="checklist__icon" aria-hidden="true">${materialIcon(m.text)}</span>
      <span>${escapeHtml(m.text)}${m.custom ? ' <span class="checklist__custom-tag">your add</span>' : ''}</span>
    </li>
  `).join('');
}

let previewRequestId = 0;

async function updatePreviewVariation(key) {
    const w = workshopByKey(key);
    const media = $('#previewMedia');
    const img = $('#previewImage');
    const spinner = $('#previewSpinner');
    const titleEl = $('#previewTitle');
    const metaEl = $('#previewMeta');

    $('#previewWorkshop').textContent = w.name;
    $('#previewBlurb').textContent = w.blurb;

    if (!media || !img) return;

    titleEl.textContent = 'Finding a work from the archive…';
    metaEl.textContent = '';
    img.classList.remove('is-ready');
    media.classList.remove('is-error');
    media.classList.add('is-loading');
    if (spinner) spinner.style.display = 'block';

    const reqId = ++previewRequestId;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const art = await fetchArtwork(w.query);
            if (reqId !== previewRequestId) return;

            await loadInto(media, img, art.image, art.title);
            if (reqId !== previewRequestId) return;

            titleEl.textContent = art.title;
            metaEl.textContent = art.credit;
            if (spinner) spinner.style.display = 'none';
            return;
        } catch (err) {
            console.warn(`Preview attempt ${attempt + 1} failed.`, err);
            if (reqId !== previewRequestId) return;
        }
    }

    titleEl.textContent = 'Could not load a work';
    metaEl.textContent = 'Please try another variation.';
    media.classList.remove('is-loading');
    if (spinner) spinner.style.display = 'none';
}

/* ---- Validation ---- */
const REQUIRED = ['fullName', 'email', 'workshop', 'skillLevel', 'sessionDate', 'sessionTime'];

function setFieldError(el, message) {
    const field = el.closest('.field');
    if (!field) return;
    field.classList.add('has-error');
    const err = $('.field__error', field);
    if (err) err.textContent = message;
}

function clearFieldError(el) {
    const field = el.closest('.field');
    if (!field) return;
    field.classList.remove('has-error');
    const err = $('.field__error', field);
    if (err) err.textContent = '';
}

function validateForm(form) {
    let ok = true;
    let firstBad = null;

    REQUIRED.forEach(name => {
        const el = form.elements[name];
        if (!el) return;
        const val = String(el.value || '').trim();
        clearFieldError(el);

        if (!val) {
            setFieldError(el, 'This field is required.');
            ok = false;
            if (!firstBad) firstBad = el;
            return;
        }

        if (name === 'email') {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (!re.test(val)) {
                setFieldError(el, 'Please enter a valid email address.');
                ok = false;
                if (!firstBad) firstBad = el;
            }
        }

        if (name === 'sessionDate') {
            const today = new Date(); today.setHours(0,0,0,0);
            const chosen = new Date(val + 'T00:00:00');
            if (chosen < today) {
                setFieldError(el, 'Please choose today or a future date.');
                ok = false;
                if (!firstBad) firstBad = el;
            }
        }
    });

    if (firstBad) firstBad.focus();
    return ok;
}

function makeRegistrationId() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `LL-${yyyy}-${mm}${dd}-${rand}`;
}

async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    const messageBox = $('#formMessage');
    const submitBtn = $('#submitBtn');

    messageBox.hidden = true;
    messageBox.classList.remove('is-success', 'is-error');

    if (!validateForm(form)) return;

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    const w = workshopByKey(data.workshop);
    const registrationId = makeRegistrationId();

    const finalMaterials = getFinalMaterials().map(m => m.text);

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    let artwork = { title: '', credit: '', image: '' };
    try {
        const art = await fetchArtwork(w.query);
        artwork = { title: art.title, credit: art.credit, image: art.image };
    } catch (err) {
        console.warn('Could not fetch a work for the email — sending without it.', err);
    }

    const payload = {
        registrationId,
        name: data.fullName.trim(),
        email: data.email.trim(),
        workshopKey: w.key,
        workshopName: w.name,
        sessionDate: data.sessionDate,
        sessionTime: data.sessionTime,
        skillLevel: data.skillLevel,
        accessibility: (data.accessibility || '').trim(),
        repeat: data.repeat || 'once',
        focus: w.focus,
        duration: w.duration,
        materials: finalMaterials,
        artworkTitle: artwork.title,
        artworkCredit: artwork.credit,
        artworkImage: artwork.image,
        createdAt: new Date().toISOString()
    };

    try {
        await sendReminderEmail(payload);
        saveReminder(payload);
        renderDashboard();
        showSuccess(payload);
        form.reset();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = $('#sessionDate');
        const timeInput = $('#sessionTime');
        if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
        if (timeInput) timeInput.value = '09:00';
        currentWorkshopKey = WORKSHOPS[0].key;
        loadMaterialsForWorkshop(currentWorkshopKey);
        updatePreviewVariation(currentWorkshopKey);
        form.hidden = true;
    } catch (err) {
        console.error(err);
        showError(err);
    } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
    }
}

async function sendReminderEmail(p) {
    const configured =
        window.emailjs &&
        EMAILJS.publicKey  &&
        EMAILJS.publicKey  !== 'YOUR_PUBLIC_KEY' &&
        EMAILJS.serviceId  !== 'YOUR_SERVICE_ID' &&
        EMAILJS.templateId !== 'YOUR_TEMPLATE_ID';

    if (!configured) {
        console.info('[The Long Look] EmailJS not fully configured. Simulating send.');
        console.info('Add your serviceId + templateId to enable real delivery.');
        console.info('Payload that would be emailed:', p);
        await new Promise(r => setTimeout(r, 900));
        return { status: 'simulated' };
    }

    const templateParams = {
        to_name:          p.name,
        to_email:         p.email,
        registration_id:  p.registrationId,
        workshop:         p.workshopName,
        session_date:     p.sessionDate,
        session_time:     p.sessionTime,
        skill_level:      p.skillLevel,
        accessibility:    p.accessibility || '—',
        repeat:           p.repeat,
        focus:            p.focus,
        duration:         p.duration,
        materials:        p.materials.join('\n• '),
        artwork_title:    p.artworkTitle,
        artwork_credit:   p.artworkCredit,
        artwork_image:    p.artworkImage,
        message:          buildPlainMessage(p)
    };

    try {
        return await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, templateParams, {
            publicKey: EMAILJS.publicKey
        });
    } catch (err) {
        if (err && (err.status === 0 || err.text === 'OK' || !err.status)) {
            return { status: 'assumed-success' };
        }
        throw err;
    }
}

function buildPlainMessage(p) {
    return [
        `Hello ${p.name},`,
        ``,
        `Your personal art reminder is set.`,
        `Reminder ID: ${p.registrationId}`,
        ``,
        `Variation: ${p.workshopName}`,
        `Focus: ${p.focus}`,
        `Suggested sitting: ${p.duration}`,
        `When: ${p.sessionDate} at ${p.sessionTime}`,
        `Repeat: ${p.repeat}`,
        `Your level: ${p.skillLevel}`,
        ``,
        `Artwork: ${p.artworkTitle || '(a work will be attached)'}`,
        `Credit: ${p.artworkCredit || ''}`,
        ``,
        `Your materials list:`,
        p.materials.length ? p.materials.map(m => `• ${m}`).join('\n') : '• (no materials listed)',
        ``,
        `Three prompts for looking:`,
        `• What is the very first thing your eye goes to?`,
        `• Where does the artist repeat a shape, colour, or mark?`,
        `• What would you change if it were yours?`,
        ``,
        `— The Long Look`
    ].join('\n');
}

function showSuccess(p) {
    const box = $('#formMessage');
    const title = $('#formMessageTitle');
    const text = $('#formMessageText');
    const idWrap = $('#registrationIdWrap');
    const idEl = $('#registrationId');

    box.classList.add('is-success');
    title.textContent = 'Reminder set';
    text.textContent =
        `Your ${p.workshopName.toLowerCase()} study is scheduled for ` +
        `${formatDateLong(p.sessionDate)} at ${p.sessionTime}. ` +
        `The work, your materials list, and the looking prompts are on their way to ${p.email}.`;
    idEl.textContent = p.registrationId;
    idWrap.hidden = false;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(err) {
    const box = $('#formMessage');
    const title = $('#formMessageTitle');
    const text = $('#formMessageText');

    box.classList.add('is-error');
    title.textContent = 'Something went wrong';
    text.textContent =
        (err && err.text) ? err.text :
            'We could not send your reminder just now. Please check your connection and try again.';
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function readReminders() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function writeReminders(arr) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.warn('Could not save reminder locally.', e);
    }
}

function saveReminder(p) {
    const arr = readReminders();
    arr.push({
        id: p.registrationId,
        name: p.name,
        email: p.email,
        workshopKey: p.workshopKey,
        workshopName: p.workshopName,
        sessionDate: p.sessionDate,
        sessionTime: p.sessionTime,
        skillLevel: p.skillLevel,
        repeat: p.repeat,
        focus: p.focus,
        materials: p.materials,
        artworkTitle: p.artworkTitle,
        artworkCredit: p.artworkCredit,
        artworkImage: p.artworkImage,
        createdAt: p.createdAt
    });
    writeReminders(arr);
}

function deleteReminder(id) {
    writeReminders(readReminders().filter(r => r.id !== id));
    renderDashboard();
}

function renderDashboard() {
    const list = $('#reminderList');
    const empty = $('#reminderEmpty');
    const count = $('#reminderCount');
    if (!list) return;

    const reminders = readReminders().sort((a, b) => {
        const da = new Date(`${a.sessionDate}T${a.sessionTime || '00:00'}`);
        const db = new Date(`${b.sessionDate}T${b.sessionTime || '00:00'}`);
        return da - db;
    });

    if (count) {
        count.textContent = reminders.length === 1
            ? '1 reminder'
            : `${reminders.length} reminders`;
    }

    if (!reminders.length) {
        list.innerHTML = '';
        if (empty) empty.hidden = false;
        return;
    }

    if (empty) empty.hidden = true;

    list.innerHTML = reminders.map(r => {
        const w = workshopByKey(r.workshopKey);
        const thumb = r.artworkImage
            ? `<img src="${escapeHtml(r.artworkImage)}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : '';

        return `
      <article class="reminder">
        <div class="reminder__thumb" style="background:${w.swatch}">
          <span class="reminder__badge">${escapeHtml(w.tag)}</span>
          ${thumb}
        </div>

        <div class="reminder__body">
          <p class="reminder__when">${escapeHtml(formatDateLong(r.sessionDate))} · ${escapeHtml(r.sessionTime || '')}</p>
          <p class="reminder__what">${escapeHtml(r.workshopName)}</p>
          <p class="reminder__art">${escapeHtml(r.artworkTitle || 'Work pending')}</p>

          <div class="reminder__foot">
            <span class="reminder__id">${escapeHtml(r.id)}</span>
            <button class="reminder__del" type="button" data-delete="${escapeHtml(r.id)}">Remove</button>
          </div>
        </div>
      </article>
    `;
    }).join('');

    $$('[data-delete]', list).forEach(btn => {
        btn.addEventListener('click', () => deleteReminder(btn.dataset.delete));
    });
}

function formatDateLong(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Re-run init once the library is definitely available
    if (window.emailjs && EMAILJS.publicKey && EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY') {
        try { emailjs.init({ publicKey: EMAILJS.publicKey }); } catch (e) {}
    }

    initNav();

    const page = document.body.dataset.page;
    if (page === 'home')     initHome();
    if (page === 'schedule') initSchedule();
});