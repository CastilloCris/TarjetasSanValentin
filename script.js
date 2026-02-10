const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initIntro();
  if (!prefersReducedMotion) {
    initCanvas();
  }
  initVideoScroll();
  initObservers();
  initSlideshow();
  initPhrases();
  initEnvelope();
});

function initPhrases() {
  const phrases = document.querySelectorAll('.phrase');
  if (!phrases.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Activate current
        entry.target.classList.add('active');
      } else {
        // Deactivate when out of view
        entry.target.classList.remove('active');
      }
    });
  }, { 
      threshold: 0.5, 
      rootMargin: "-40% 0px -40% 0px" // Only trigger when in the middle 20% of screen
  });

  phrases.forEach(phrase => observer.observe(phrase));
}

function initAudio() {
  const music = document.getElementById('music');
  const gate = document.getElementById('audioGate');
  if (!music) return;
  
  const playMusic = () => {
    music.volume = 0.18;
    return music.play().then(() => {
      if (gate) gate.classList.add('hidden');
    }).catch(() => {
      if (gate) gate.classList.remove('hidden');
    });
  };

  if (gate) {
    gate.addEventListener('click', () => {
      playMusic();
    });
  }

  document.addEventListener('touchstart', playMusic, { once: true, passive: true });
  document.addEventListener('click', playMusic, { once: true });
}

function initIntro() {
  const intro = document.getElementById('intro');
  const hint = document.querySelector('.hint');
  
  if (intro) {
    setTimeout(() => intro.classList.add('show'), 800);
  }

  // Fade out intro and hint on scroll (incl. mobile)
  const fadeStart = 10;
  const fadeEnd = 200;
  let ticking = false;

  const updateIntro = () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let opacity = 1;
    if (scrollY > fadeStart) {
      opacity = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
      opacity = Math.max(0, opacity);
    }

    if (intro) {
      if (intro.classList.contains('show')) {
        intro.style.opacity = opacity;
      }
      if (scrollY >= fadeEnd) {
        intro.classList.add('hidden');
      } else {
        intro.classList.remove('hidden');
      }
    }

    if (hint) {
      hint.style.opacity = opacity * 0.4;
    }

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateIntro);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchmove', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateIntro();
}

function initCanvas() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 100; // Slightly fewer but prettier
  let scrollEnergy = 0;
  let lastScroll = window.scrollY;

  const colors = ['#ff7a8a', '#ffb563', '#fff1e6', '#ffd29b'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();

  // Create particles
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5 - 0.2, // Slight upward drift
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * 0.1
    });
  }

  // Scroll energy tracker
  window.addEventListener('scroll', () => {
    const delta = Math.abs(window.scrollY - lastScroll);
    scrollEnergy += delta * 0.005;
    scrollEnergy = Math.min(scrollEnergy, 2);
    lastScroll = window.scrollY;
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      // Movement
      p.x += p.vx;
      p.y += p.vy - scrollEnergy * 0.5; // Move up faster on scroll

      // Wrap around
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Pulse
      p.alpha += p.pulse;
      if (p.alpha > 0.8 || p.alpha < 0.2) p.pulse *= -1;

      // Draw
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 10; // Glow effect
      ctx.shadowColor = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
      ctx.globalAlpha = 1;
    });

    scrollEnergy *= 0.95;
    requestAnimationFrame(draw);
  }

  draw();
}

function initVideoScroll() {
  const videoLayer = document.getElementById('videoLayer');
  const video = document.getElementById('bgVideo');

  if (!videoLayer || !video) return;

  if (video) {
    video.play().catch(() => {});
  }

  // Use requestAnimationFrame loop for smooth updates based on scroll
  function updateVideo() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // Video opacity and effects (capped at 1)
    const videoProgress = Math.min(scrollY / windowHeight, 1);
    
    // Logic for persistent video background:
    // 1. Initial fade in (0 to 1)
    // 2. Stay visible but maybe dimmed in later sections
    
    // Initial fade in logic
    if (videoProgress < 1) {
       videoLayer.style.opacity = videoProgress;
    } else {
       // Ensure it stays visible
       videoLayer.style.opacity = 1;
       videoLayer.classList.add('persistent');
    }

    // Only apply heavy filter updates if visible
    if (videoProgress > 0) {
        const blurAmount = Math.max(0, 22 - videoProgress * 20);
        video.style.filter = `blur(${blurAmount}px) brightness(${0.9 + videoProgress * 0.2}) saturate(${1.2 + videoProgress * 0.3})`;
        video.style.transform = `scale(${1.15 - videoProgress * 0.1})`;
    }

    requestAnimationFrame(updateVideo);
  }

  updateVideo();
}

function initSlideshow() {
  const container = document.querySelector('.memories-container');
  const slides = document.querySelectorAll('.slide');
  const hint = document.querySelector('.continue-hint');
  
  if (!container || slides.length === 0) return;

  if (prefersReducedMotion) {
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === 0);
      slide.classList.remove('exit');
    });
    if (hint) hint.classList.add('show');
    return;
  }

  let hasStarted = false;
  let currentSlide = 0;
  const slideDuration = 4000; // Time per slide in ms

  // Observer to start slideshow when container is fully visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Trigger when a significant portion is visible to ensure user "arrived"
      if (entry.isIntersecting && entry.intersectionRatio > 0.4 && !hasStarted) {
        hasStarted = true;
        startSlideshow();
      }
    });
  }, { threshold: 0.45 });

  observer.observe(container);

  function startSlideshow() {
    // Show first slide immediately
    showSlide(0);

    const interval = setInterval(() => {
      // Exit current slide
      slides[currentSlide].classList.remove('active');
      slides[currentSlide].classList.add('exit');
      
      // Move to next
      currentSlide++;

      if (currentSlide < slides.length) {
        showSlide(currentSlide);
      } else {
        // End of slideshow
        clearInterval(interval);
        if (hint) hint.classList.add('show');
        
        // Auto scroll to final section after a delay
        setTimeout(() => {
            const finalSection = document.getElementById('finalSection');
            if (finalSection) {
                finalSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 2000);
      }
    }, slideDuration);
  }

  function showSlide(index) {
    if (slides[index]) {
      // Reset exit class if looping (though we aren't looping here)
      slides[index].classList.remove('exit');
      // Trigger reflow to restart animation if needed
      void slides[index].offsetWidth; 
      slides[index].classList.add('active');
    }
  }
}

function initObservers() {
  // Can be used for generic reveal animations if needed
}

function initEnvelope() {
    const envelopeSection = document.getElementById('finalSection');
    const envelope = document.querySelector('.envelope');
    const envelopeWrapper = document.getElementById('envelopeWrapper');
    const grandFinale = document.getElementById('grandFinale');
    
    if (!envelopeSection || !envelope) return;

    let hasOpened = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !hasOpened) {
                hasOpened = true;
                
                // 1. Wait a moment, then open envelope
                setTimeout(() => {
                    envelope.classList.add('open');
                    
                    // 2. Start 20s timer for Grand Finale
                    setTimeout(() => {
                        // Fade out envelope
                        if (envelopeWrapper) envelopeWrapper.classList.add('hidden');
                        
                        // Show Grand Finale
                        setTimeout(() => {
                            if (grandFinale) grandFinale.classList.add('show');
                        }, 1000); // Wait for envelope to fade out
                        
                    }, 20000); // 20 seconds
                    
                }, 1000);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(envelopeSection);
}
