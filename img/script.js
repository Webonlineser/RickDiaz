const videoCards = document.querySelectorAll('.video-card');
const galleryCarousel = document.querySelector('.gallery-carousel');
const prevButton = document.querySelector('.gallery-nav.prev');
const nextButton = document.querySelector('.gallery-nav.next');
const imageZoomOverlay = document.getElementById('imageZoomOverlay');
const overlayImage = document.getElementById('overlayImage');
const overlayClose = document.getElementById('overlayClose');
const magneticItems = document.querySelectorAll('[data-magnetic]');
const revealElements = document.querySelectorAll('.reveal');
const heroArtCard = document.querySelector('.hero-art-card');

let isDragging = false;
let startX = 0;
let scrollStart = 0;
let lastX = 0;
let lastTime = 0;
let velocity = 0;
let momentumId = null;
let scrollTicking = false;
const isTouchDevice = window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const moveGallery = (delta) => {
  galleryCarousel?.scrollBy({ left: delta, behavior: 'smooth' });
};

const animateMomentum = () => {
  if (!galleryCarousel) return;
  velocity *= 0.92;
  galleryCarousel.scrollLeft -= velocity * 28;

  if (Math.abs(velocity) > 0.3) {
    momentumId = requestAnimationFrame(animateMomentum);
  } else {
    momentumId = null;
  }
};

if (galleryCarousel) {
  const scrollAmount = galleryCarousel.clientWidth * 0.75;

  prevButton?.addEventListener('click', () => moveGallery(-scrollAmount));
  nextButton?.addEventListener('click', () => moveGallery(scrollAmount));

  galleryCarousel.addEventListener('pointerdown', (event) => {
    isDragging = true;
    startX = event.pageX - galleryCarousel.offsetLeft;
    scrollStart = galleryCarousel.scrollLeft;
    lastX = event.pageX;
    lastTime = performance.now();
    velocity = 0;
    galleryCarousel.setPointerCapture(event.pointerId);
    galleryCarousel.classList.add('dragging');
    if (momentumId) cancelAnimationFrame(momentumId);
  });

  galleryCarousel.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const x = event.pageX - galleryCarousel.offsetLeft;
    const walk = (x - startX) * 1.2;
    galleryCarousel.scrollLeft = scrollStart - walk;

    const now = performance.now();
    const dx = event.pageX - lastX;
    const dt = Math.max(now - lastTime, 16);
    velocity = dx / dt;
    lastX = event.pageX;
    lastTime = now;
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    galleryCarousel.classList.remove('dragging');
    try { galleryCarousel.releasePointerCapture(event.pointerId); } catch (error) { }

    if (Math.abs(velocity) > 0.08) {
      momentumId = requestAnimationFrame(animateMomentum);
    }
  };

  galleryCarousel.addEventListener('pointerup', endDrag);
  galleryCarousel.addEventListener('pointercancel', endDrag);
  galleryCarousel.addEventListener('pointerleave', () => {
    if (isDragging) {
      isDragging = false;
      galleryCarousel.classList.remove('dragging');
      if (Math.abs(velocity) > 0.08) momentumId = requestAnimationFrame(animateMomentum);
    }
  });
}

const closeOverlay = () => {
  if (!imageZoomOverlay) return;
  imageZoomOverlay.classList.remove('active');
  document.body.classList.remove('overlay-active');
  overlayImage.src = '';
  overlayImage.alt = 'Imagen ampliada';
};

if (imageZoomOverlay) {
  imageZoomOverlay.addEventListener('click', (event) => {
    if (event.target === imageZoomOverlay || event.target.id === 'overlayClose' || event.target.classList.contains('overlay-backdrop')) {
      closeOverlay();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && imageZoomOverlay.classList.contains('active')) {
      closeOverlay();
    }
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.18,
});

revealElements.forEach((element) => revealObserver.observe(element));

galleryCarousel?.querySelectorAll('.gallery-card').forEach((card) => {
  const image = card.querySelector('img');
  card.addEventListener('click', () => {
    card.classList.add('clicked');
    window.setTimeout(() => card.classList.remove('clicked'), 260);
    if (image && imageZoomOverlay && overlayImage) {
      overlayImage.src = image.src;
      overlayImage.alt = image.alt;
      imageZoomOverlay.classList.add('active');
      document.body.classList.add('overlay-active');
    }
  });

  card.addEventListener('pointermove', (event) => {
    if (isDragging || isTouchDevice || event.pointerType === 'touch') return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const tiltX = ((y / rect.height) - 0.5) * 18;
    const tiltY = ((x / rect.width) - 0.5) * 18;
    card.style.setProperty('--tilt-x', `${tiltX}deg`);
    card.style.setProperty('--tilt-y', `${tiltY}deg`);
    if (image) {
      image.style.transform = `translate3d(${tiltY * 0.5}px, ${tiltX * -0.4}px, 0) scale(1.04)`;
    }
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    if (image) {
      image.style.transform = '';
    }
  });
});

magneticItems.forEach((item) => {
  const strength = 16;
  item.addEventListener('pointermove', (event) => {
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const moveX = ((x / rect.width) - 0.5) * strength;
    const moveY = ((y / rect.height) - 0.5) * strength;
    item.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
  });
  item.addEventListener('pointerleave', () => {
    item.style.transform = '';
  });
});

if (heroArtCard) {
  const onScroll = () => {
    const offset = clamp(window.scrollY / 18, 0, 22);
    document.documentElement.style.setProperty('--hero-offset', `${offset}px`);
    const depth = clamp(window.scrollY / 320, 0, 0.28);
    document.documentElement.style.setProperty('--scroll-depth', `${depth}`);
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        onScroll();
        scrollTicking = false;
      });
    }
  });
}

videoCards.forEach((card) => {
  const preview = card.querySelector('.video-preview');
  const video = card.querySelector('video');

  if (!preview || !video) return;

  const playVideo = () => {
    card.classList.add('playing');
    video.style.display = 'block';
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => {
      card.classList.add('playing');
    });
  };

  preview.addEventListener('click', playVideo);
  preview.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playVideo();
    }
  });

  video.addEventListener('play', () => {
    card.classList.add('is-active');
  });

  const resetPreview = () => {
    card.classList.remove('playing');
    card.classList.remove('is-active');
  };

  video.addEventListener('pause', resetPreview);
  video.addEventListener('ended', resetPreview);
});
