import React, { useState, useEffect, useCallback } from "react";
import { BANNER_SLIDES } from "../data/bannerSlides";

const AUTOPLAY_MS = 5000;

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = BANNER_SLIDES.length;

  const goTo = useCallback((i) => {
    setIndex((prev) => (i + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [index, paused, next, total]);

  if (!total) return null;

  return (
    <section
      className="banner-carousel"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="banner-carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {BANNER_SLIDES.map((slide) => (
          <div key={slide.id} className="banner-carousel__slide">
            {slide.type === "image" ? (
              <div className="banner-carousel__slide-image-wrap">
                <img src={slide.src} alt={slide.alt || ""} className="banner-carousel__slide-image" />
                {slide.title && (
                  <div className="banner-carousel__slide-overlay">
                    <h2 className="banner-carousel__slide-title">{slide.title}</h2>
                    {slide.text && <p className="banner-carousel__slide-text">{slide.text}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="banner-carousel__slide-content"
                style={{ background: slide.gradient }}
              >
                <h2 className="banner-carousel__slide-title">{slide.title}</h2>
                {slide.text && <p className="banner-carousel__slide-text">{slide.text}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="banner-carousel__btn banner-carousel__btn--prev"
            onClick={prev}
            aria-label="Предыдущий слайд"
          >
            ‹
          </button>
          <button
            type="button"
            className="banner-carousel__btn banner-carousel__btn--next"
            onClick={next}
            aria-label="Следующий слайд"
          >
            ›
          </button>
          <div className="banner-carousel__dots">
            {BANNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`banner-carousel__dot ${i === index ? "banner-carousel__dot--active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Слайд ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
