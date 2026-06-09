const videoCards = document.querySelectorAll('.video-card');

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
      // En caso de bloqueo, dejamos al usuario ver el video con los controles
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
