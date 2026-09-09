import { useEffect, useState } from "react";
import styles from "./HomeBanner.module.css";

const bannerSlides = [
    {
        id: "quiet-luxury",
        eyebrow: "Autumn / Winter 2026",
        title: "Quietly considered.",
        description: "A study in soft tailoring, natural texture and pieces made to move with you.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=85",
    },
    {
        id: "after-hours",
        eyebrow: "The after-hours edit",
        title: "Dress for the in-between.",
        description: "Silhouettes that take you from the last light to wherever the evening leads.",
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=85",
    },
    {
        id: "new-season",
        eyebrow: "New season essentials",
        title: "Wear the feeling.",
        description: "Grounded layers and luminous details for a wardrobe with a point of view.",
        image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85",
    },
];

const HomeBanner = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveSlide((currentSlide) => (currentSlide + 1) % bannerSlides.length);
        }, 5000);

        return () => window.clearInterval(interval);
    }, []);

    const goToSlide = (slideIndex) => {
        setActiveSlide((slideIndex + bannerSlides.length) % bannerSlides.length);
    };

    return (
        <section className={styles.banner} aria-label="Featured collections">
            <div className={styles.slides}>
                {bannerSlides.map((slide, index) => (
                    <article className={`${styles.slide} ${index === activeSlide ? styles.activeSlide : ""}`} key={slide.id}>
                        <img className={styles.image} src={slide.image} alt="" />
                        <div className={styles.overlay} />
                        <div className={styles.content}>
                            <p className={styles.eyebrow}>{slide.eyebrow}</p>
                            <h1 className={styles.title}>{slide.title}</h1>
                            <p className={styles.description}>{slide.description}</p>
                            <a className={styles.cta} href="#the-edit">Explore the edit <span aria-hidden="true">↗</span></a>
                        </div>
                    </article>
                ))}
            </div>

            <div className={styles.controls}>
                <button type="button" onClick={() => goToSlide(activeSlide - 1)} aria-label="Previous slide">←</button>
                <div className={styles.dots}>
                    {bannerSlides.map((slide, index) => (
                        <button
                            className={`${styles.dot} ${index === activeSlide ? styles.activeDot : ""}`}
                            type="button"
                            key={slide.id}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === activeSlide ? "true" : undefined}
                        />
                    ))}
                </div>
                <button type="button" onClick={() => goToSlide(activeSlide + 1)} aria-label="Next slide">→</button>
            </div>
        </section>
    );
};

export default HomeBanner;