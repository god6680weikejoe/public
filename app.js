const photos = [
  {
    id: 1,
    title: '日常生活 01',
    src: './assets/full/photo-01.jpg',
    thumb: './assets/thumb/photo-01.jpg'
  },
  {
    id: 2,
    title: '日常生活 02',
    src: './assets/full/photo-02.jpg',
    thumb: './assets/thumb/photo-02.jpg'
  },
  {
    id: 3,
    title: '日常生活 03',
    src: './assets/full/photo-03.jpg',
    thumb: './assets/thumb/photo-03.jpg'
  },
  {
    id: 4,
    title: '日常生活 04',
    src: './assets/full/photo-04.jpg',
    thumb: './assets/thumb/photo-04.jpg'
  },
  {
    id: 5,
    title: '日常生活 05',
    src: './assets/full/photo-05.jpg',
    thumb: './assets/thumb/photo-05.jpg'
  },
  {
    id: 6,
    title: '日常生活 06',
    src: './assets/full/photo-06.jpg',
    thumb: './assets/thumb/photo-06.jpg'
  },
  {
    id: 7,
    title: '日常生活 07',
    src: './assets/full/photo-07.jpg',
    thumb: './assets/thumb/photo-07.jpg'
  },
  {
    id: 8,
    title: '日常生活 08',
    src: './assets/full/photo-08.jpg',
    thumb: './assets/thumb/photo-08.jpg'
  },
  {
    id: 9,
    title: '日常生活 09',
    src: './assets/full/photo-09.jpg',
    thumb: './assets/thumb/photo-09.jpg'
  },
  {
    id: 10,
    title: '日常生活 10',
    src: './assets/full/photo-10.jpg',
    thumb: './assets/thumb/photo-10.jpg'
  },
  {
    id: 11,
    title: '日常生活 11',
    src: './assets/full/photo-11.jpg',
    thumb: './assets/thumb/photo-11.jpg'
  },
  {
    id: 12,
    title: '日常生活 12',
    src: './assets/full/photo-12.jpg',
    thumb: './assets/thumb/photo-12.jpg'
  }
];

const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const closeBtn = document.getElementById('closeBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const lightboxBackdrop = document.getElementById('lightboxBackdrop');
const lightboxContent = document.querySelector('.lightbox__content');
const bgmAudio = document.getElementById('bgmAudio');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const effectsToggleBtn = document.getElementById('effectsToggleBtn');

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverCapableQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const effectsStorageKey = 'photoWallEffectsEnabled';

let revealObserver = null;
let currentIndex = 0;
let lightboxHideTimer = 0;
let lightboxSwitchTimer = 0;
let touchStartX = 0;
let touchStartY = 0;
let carouselModeActive = false;

function shouldUseCarouselMode() {
  return effectsEnabled && !reduceMotionQuery.matches && window.innerWidth >= 960 && photos.length >= 6;
}
let effectsEnabled = readEffectsPreference();

function readEffectsPreference() {
  try {
    const stored = window.localStorage.getItem(effectsStorageKey);
    if (stored === 'true') {
      return true;
    }
    if (stored === 'false') {
      return false;
    }
  } catch {}

  return !reduceMotionQuery.matches;
}

function persistEffectsPreference() {
  try {
    window.localStorage.setItem(effectsStorageKey, String(effectsEnabled));
  } catch {}
}

function updateEffectsButtonState() {
  if (!effectsToggleBtn) {
    return;
  }

  effectsToggleBtn.classList.toggle('is-off', !effectsEnabled);
  effectsToggleBtn.textContent = effectsEnabled ? '✨ 炫酷模式：开' : '✨ 炫酷模式：关';
  effectsToggleBtn.setAttribute('aria-label', effectsEnabled ? '关闭炫酷特效' : '开启炫酷特效');
}

function applyEffectsMode() {
  carouselModeActive = shouldUseCarouselMode();
  document.body.classList.toggle('fx-off', !effectsEnabled);
  document.body.classList.toggle('fx-carousel', carouselModeActive);
  gallery.classList.remove('is-interacting');
  updateEffectsButtonState();
}

function setupEffectsToggle() {
  if (!effectsToggleBtn) {
    return;
  }

  effectsToggleBtn.addEventListener('click', () => {
    effectsEnabled = !effectsEnabled;
    applyEffectsMode();
    persistEffectsPreference();
    renderGallery();
  });
}

function setupGallerySpotlight() {
  if (!gallery || reduceMotionQuery.matches || !hoverCapableQuery.matches) {
    return;
  }

  gallery.addEventListener('pointerenter', () => {
    if (!effectsEnabled || carouselModeActive) {
      return;
    }

    gallery.classList.add('is-interacting');
  });

  gallery.addEventListener('pointermove', (event) => {
    if (!effectsEnabled || carouselModeActive) {
      return;
    }

    const rect = gallery.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    gallery.style.setProperty('--spot-x', `${Math.max(0, Math.min(100, x)).toFixed(1)}%`);
    gallery.style.setProperty('--spot-y', `${Math.max(0, Math.min(100, y)).toFixed(1)}%`);
  });

  gallery.addEventListener('pointerleave', () => {
    gallery.classList.remove('is-interacting');
  });
}

function setMusicButtonState({ playing = false, disabled = false, text = '' } = {}) {
  if (!musicToggleBtn) {
    return;
  }

  musicToggleBtn.classList.toggle('is-playing', playing);
  musicToggleBtn.classList.toggle('is-disabled', disabled);
  musicToggleBtn.disabled = disabled;
  musicToggleBtn.textContent = text || (playing ? '🎵 音乐播放中' : '🎵 播放音乐');
  musicToggleBtn.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
}

function setupBackgroundMusic() {
  if (!bgmAudio || !musicToggleBtn) {
    return;
  }

  bgmAudio.volume = 0.36;
  bgmAudio.loop = true;

  const tryPlay = () =>
    bgmAudio
      .play()
      .then(() => {
        setMusicButtonState({ playing: true });
      })
      .catch(() => {
        setMusicButtonState({ playing: false, text: '🎵 点击播放音乐' });
      });

  musicToggleBtn.addEventListener('click', () => {
    if (bgmAudio.paused) {
      tryPlay();
      return;
    }

    bgmAudio.pause();
    setMusicButtonState({ playing: false, text: '🎵 播放音乐' });
  });

  bgmAudio.addEventListener('play', () => setMusicButtonState({ playing: true }));
  bgmAudio.addEventListener('pause', () => setMusicButtonState({ playing: false }));
  bgmAudio.addEventListener('error', () => {
    setMusicButtonState({
      disabled: true,
      text: '🎵 未找到音乐文件'
    });
  });

  window.addEventListener(
    'pointerdown',
    () => {
      if (bgmAudio.paused) {
        tryPlay();
      }
    },
    { once: true }
  );

  tryPlay();
}

function cardVariant(index) {
  if (index % 5 === 0) {
    return 'card--tall';
  }
  if (index % 4 === 0) {
    return 'card--wide';
  }
  return '';
}

function setCardTilt(card, pointerEvent) {
  if (!effectsEnabled || carouselModeActive) {
    return;
  }

  const rect = card.getBoundingClientRect();
  const x = (pointerEvent.clientX - rect.left) / rect.width;
  const y = (pointerEvent.clientY - rect.top) / rect.height;
  const rotateY = (x - 0.5) * 10;
  const rotateX = (0.5 - y) * 10;

  card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
  card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
  card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
  card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
}

function resetCardTilt(card) {
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
  card.style.setProperty('--mx', '50%');
  card.style.setProperty('--my', '50%');
}

function bindCardMotion(card, index, useCarouselMode) {
  if (useCarouselMode) {
    card.classList.add('is-visible');
    return;
  }

  if (!reduceMotionQuery.matches && effectsEnabled) {
    card.classList.add('motion-ready');
    card.style.setProperty('--delay', `${Math.min(index * 45, 420)}ms`);
    card.style.setProperty('--img-delay', `${(index * 320) % 2100}ms`);
    card.style.setProperty('--float-delay', `${(index * 190) % 1600}ms`);
    card.style.setProperty('--float-distance', `${5 + (index % 4)}px`);
  } else {
    card.classList.add('is-visible');
  }

  if (!reduceMotionQuery.matches && hoverCapableQuery.matches && effectsEnabled) {
    card.addEventListener('pointermove', (event) => setCardTilt(card, event));
    card.addEventListener('pointerleave', () => resetCardTilt(card));
    card.addEventListener('pointerdown', () => resetCardTilt(card));
  }
}

function setupReveal(cards, useCarouselMode) {
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = null;
  }

  if (useCarouselMode) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px'
    }
  );

  cards.forEach((card) => revealObserver.observe(card));
}

function renderGallery() {
  gallery.innerHTML = '';
  const cards = [];
  const useCarouselMode = shouldUseCarouselMode();
  carouselModeActive = useCarouselMode;

  gallery.classList.toggle('gallery--carousel', useCarouselMode);
  document.body.classList.toggle('fx-carousel', useCarouselMode);

  if (useCarouselMode) {
    gallery.style.setProperty('--carousel-count', String(photos.length));
    gallery.style.setProperty('--carousel-radius', `${Math.max(320, Math.min(540, photos.length * 42))}px`);
  } else {
    gallery.style.removeProperty('--carousel-count');
    gallery.style.removeProperty('--carousel-radius');
  }

  photos.forEach((photo, index) => {
    const card = document.createElement('button');
    const variant = useCarouselMode ? '' : cardVariant(index);
    card.className = `card ${variant}`.trim();
    card.type = 'button';
    card.setAttribute('aria-label', `查看 ${photo.title}`);
    card.innerHTML = `<img src="${photo.thumb}" alt="${photo.title}" loading="lazy" />`;

    if (useCarouselMode) {
      card.classList.add('card--carousel');
      card.style.setProperty('--i', String(index));
      card.style.setProperty('--count', String(photos.length));
    }

    bindCardMotion(card, index, useCarouselMode);
    card.addEventListener('click', () => openLightbox(index, 0));
    gallery.append(card);
    cards.push(card);
  });

  setupReveal(cards, useCarouselMode);
}

function switchLightboxPhoto(photo, withMotion = false, direction = 0) {
  if (!photo) {
    return;
  }

  lightbox.classList.remove('is-switching-next', 'is-switching-prev');

  if (withMotion && !reduceMotionQuery.matches && effectsEnabled) {
    lightbox.classList.add('is-switching');
    if (direction > 0) {
      lightbox.classList.add('is-switching-next');
    } else if (direction < 0) {
      lightbox.classList.add('is-switching-prev');
    }

    window.clearTimeout(lightboxSwitchTimer);
    lightboxSwitchTimer = window.setTimeout(() => {
      lightbox.classList.remove('is-switching');
      lightbox.classList.remove('is-switching-next', 'is-switching-prev');
    }, 180);
  }

  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.title;
  lightboxTitle.textContent = photo.title;
}

function openLightbox(index, direction = 0) {
  currentIndex = index;
  const current = photos[currentIndex];
  if (!current) {
    return;
  }

  const shouldAnimateSwitch = !lightbox.hidden;
  if (lightbox.hidden) {
    window.clearTimeout(lightboxHideTimer);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      lightbox.classList.add('is-open');
    });
  } else {
    lightbox.classList.add('is-open');
  }

  switchLightboxPhoto(current, shouldAnimateSwitch, direction);
}

function closeLightbox() {
  if (lightbox.hidden) {
    return;
  }

  lightbox.classList.remove('is-open');
  lightbox.classList.remove('is-switching');
  lightbox.classList.remove('is-switching-next', 'is-switching-prev');
  window.clearTimeout(lightboxHideTimer);
  window.clearTimeout(lightboxSwitchTimer);

  const finishClose = () => {
    if (lightbox.classList.contains('is-open')) {
      return;
    }
    lightbox.hidden = true;
    lightboxImage.src = '';
    document.body.style.overflow = '';
  };

  if (reduceMotionQuery.matches) {
    finishClose();
    return;
  }

  lightboxHideTimer = window.setTimeout(finishClose, 340);
}

function changeSlide(delta) {
  const length = photos.length;
  if (!length) {
    return;
  }

  currentIndex = (currentIndex + delta + length) % length;
  openLightbox(currentIndex, delta);
}

closeBtn.addEventListener('click', closeLightbox);
lightboxBackdrop.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', () => changeSlide(-1));
nextBtn.addEventListener('click', () => changeSlide(1));

lightboxContent.addEventListener(
  'touchstart',
  (event) => {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  },
  { passive: true }
);

lightboxContent.addEventListener(
  'touchend',
  (event) => {
    if (lightbox.hidden || event.changedTouches.length !== 1) {
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      changeSlide(deltaX > 0 ? -1 : 1);
    }
  },
  { passive: true }
);

window.addEventListener('keydown', (event) => {
  if (lightbox.hidden) {
    return;
  }

  if (event.key === 'Escape') {
    closeLightbox();
  }

  if (event.key === 'ArrowLeft') {
    changeSlide(-1);
  }

  if (event.key === 'ArrowRight') {
    changeSlide(1);
  }
});

if (typeof reduceMotionQuery.addEventListener === 'function') {
  reduceMotionQuery.addEventListener('change', () => {
    if (reduceMotionQuery.matches && effectsEnabled) {
      effectsEnabled = false;
      persistEffectsPreference();
    }

    applyEffectsMode();
    gallery.classList.remove('is-interacting');
    renderGallery();
    if (!lightbox.hidden) {
      switchLightboxPhoto(photos[currentIndex], false, 0);
    }
  });
}

window.addEventListener('resize', () => {
  const nextCarouselMode = shouldUseCarouselMode();
  if (nextCarouselMode !== carouselModeActive) {
    applyEffectsMode();
    renderGallery();
  }
});

applyEffectsMode();
renderGallery();
setupGallerySpotlight();
setupBackgroundMusic();
setupEffectsToggle();
