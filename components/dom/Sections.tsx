"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStore } from "@/lib/store";
import ContactForm from "./ContactForm";

gsap.registerPlugin(ScrollTrigger);

/** SplitText-паттерн: строка → слова → буквы, каждая в своём span. */
function Split({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`split ${className}`} aria-label={text} role="text">
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="split-word" aria-hidden>
          {[...word].map((ch, ci) => (
            <span key={ci} className="split-char">
              <span className="split-char-inner">{ch}</span>
            </span>
          ))}
          {wi < text.split(" ").length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

function Card({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <article className="feature-card" data-cursor="view" data-sfx>
      <span className="feature-index">{index}</span>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-text">{children}</p>
      <div className="feature-glare" aria-hidden />
    </article>
  );
}

export default function Sections() {
  const root = useRef<HTMLDivElement>(null);
  const heroTitle = useRef<HTMLHeadingElement>(null);
  const introDone = useStore((s) => s.introDone);
  const reducedMotion = useStore((s) => s.reducedMotion);

  // выход героя — после раскрытия прелоадера
  useEffect(() => {
    if (!introDone || !heroTitle.current) return;
    if (reducedMotion) {
      gsap.set(".hero .split-char-inner, .hero-fade", { opacity: 1, yPercent: 0 });
      return;
    }
    gsap.timeline()
      .fromTo(
        heroTitle.current.querySelectorAll(".split-char-inner"),
        { yPercent: 115, rotate: 8 },
        { yPercent: 0, rotate: 0, duration: 1.1, ease: "power4.out", stagger: 0.045 }
      )
      .fromTo(".hero-fade", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, "-=0.5");
  }, [introDone, reducedMotion]);

  useLayoutEffect(() => {
    if (reducedMotion) {
      gsap.set(".split-char-inner, [data-reveal]", { clearProps: "all", opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      // кинетические заголовки: буквы влетают в такт движению камеры (scrub)
      gsap.utils.toArray<HTMLElement>("[data-kinetic]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll(".split-char-inner"),
          { yPercent: 120, rotate: 10, opacity: 0 },
          {
            yPercent: 0, rotate: 0, opacity: 1, ease: "power3.out", stagger: 0.03,
            scrollTrigger: { trigger: el, start: "top 88%", end: "top 38%", scrub: 1 },
          }
        );
      });

      // абзацы и мелкие блоки — мягкое всплытие
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      });

      // горизонтальная галерея внутри вертикального скролла
      const track = document.querySelector<HTMLElement>(".h-track");
      if (track) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: ".h-pin",
            start: "top top",
            end: "+=220%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div ref={root} className="content">
      {/* 00 — ПОВЕРХНОСТЬ */}
      <section className="chapter hero">
        <p className="eyebrow hero-fade">Мануфактура глубины · осн. 1968</p>
        <h1 ref={heroTitle} className="hero-title" data-cursor="view">
          <Split text="NADIR" />
        </h1>
        <p className="hero-tagline hero-fade">Часы, рождённые давлением</p>
        <div className="hero-hint hero-fade" aria-hidden>
          <span className="hero-hint-line" />
          <span>скролл — начать погружение</span>
        </div>
      </section>

      {/* 01 — ПОГРУЖЕНИЕ */}
      <section className="chapter ch-philosophy">
        <h2 className="chapter-title" data-kinetic>
          <Split text="Поверхность" />
          <Split text="лжёт" className="split-accent" />
        </h2>
        <p className="chapter-text" data-reveal>
          Свет достаёт до сорока метров. Дальше начинается честность: температура,
          давление и время — единственное, что имеет значение. Мы делаем инструмент
          для этой честности.
        </p>
      </section>

      {/* 02 — ТОЛЩА: горизонтальная галерея */}
      <section className="h-pin" data-cursor="drag">
        <div className="h-track">
          <div className="h-slide h-slide-intro">
            <span className="eyebrow">Конструкция</span>
            <h2 className="chapter-title">
              <Split text="Толща" />
            </h2>
            <p className="chapter-text">Три решения, которые держат 750 атмосфер.</p>
          </div>
          <div className="h-slide">
            <Card index="01" title="Корпус-моноблок">
              Выточен из цельной заготовки титана Grade 5. Ни одного сварного шва —
              давлению не за что зацепиться.
            </Card>
          </div>
          <div className="h-slide">
            <Card index="02" title="Сапфир 6,2 мм">
              Купольное стекло держит нагрузку сводом арки: чем сильнее давит океан,
              тем плотнее посадка.
            </Card>
          </div>
          <div className="h-slide">
            <Card index="03" title="Гелиевый клапан">
              Автоматический выпуск при сатурационных погружениях. Открывается сам.
              Вы даже не узнаете, что он работал.
            </Card>
          </div>
        </div>
      </section>

      {/* 03 — СВЕЧЕНИЕ */}
      <section className="chapter ch-glow">
        <h2 className="chapter-title" data-kinetic>
          <Split text="Свет" />
          <Split text="изнутри" className="split-accent" />
        </h2>
        <p className="chapter-text" data-reveal>
          На трёх тысячах метров света нет — если вы не принесли его с собой.
          Светомасса девятого класса горит всю ночь погружения, как планктон,
          вспыхивающий от прикосновения.
        </p>
        <ul className="spec-list" data-reveal>
          <li><span>Калибр</span><b>NADIR N-01, мануфактурный</b></li>
          <li><span>Запас хода</span><b>120 часов</b></li>
          <li><span>Частота</span><b>28 800 пк/ч</b></li>
        </ul>
      </section>

      {/* 04 — АБИСС: продукт */}
      <section className="chapter ch-product">
        <span className="eyebrow" data-reveal>Абиссальная серия</span>
        <h2 className="chapter-title chapter-title-product" data-kinetic>
          <Split text="Abyssal" />
          <Split text="One" className="split-accent" />
        </h2>
        <p className="chapter-text" data-reveal>
          7 500 метров гарантированной глубины. Титан, сапфир, латунь безеля,
          восемьдесят восемь экземпляров. Каждый испытан в камере давления —
          сертификат прилагается к серийному номеру.
        </p>
        <ul className="spec-list spec-list-wide" data-reveal>
          <li><span>Глубина</span><b>7 500 м / 750 АТМ</b></li>
          <li><span>Диаметр</span><b>44 мм</b></li>
          <li><span>Тираж</span><b>88 экз.</b></li>
        </ul>
      </section>

      {/* 05 — ВСПЛЫТИЕ / КОНТАКТ */}
      <section className="chapter ch-contact">
        <p className="eyebrow" data-reveal>Всплытие</p>
        <h2 className="chapter-title" data-kinetic>
          <Split text="Поднимайтесь." />
        </h2>
        <p className="chapter-text" data-reveal>
          Доступ к серии — по заявке. Мы отвечаем в течение одного приливного цикла.
        </p>
        <ContactForm />
        <footer className="footer" data-reveal>
          <span>NADIR · мануфактура глубины</span>
          <span>Женева — Марианская впадина</span>
        </footer>
      </section>
    </div>
  );
}
