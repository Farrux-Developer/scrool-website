"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { useStore } from "@/lib/store";

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Магнитная кнопка: тянется к курсору внутри своей области,
 * пружиной возвращается на место при уходе.
 */
export default function MagneticButton({ children, className = "", href, onClick }: Props) {
  const el = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const inner = useRef<HTMLSpanElement>(null);

  const onMove = (e: MouseEvent) => {
    const { isTouch, reducedMotion } = useStore.getState();
    if (isTouch || reducedMotion || !el.current || !inner.current) return;
    const r = el.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.current.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
    inner.current.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
  };

  const onLeave = () => {
    if (!el.current || !inner.current) return;
    el.current.style.transform = "";
    inner.current.style.transform = "";
  };

  const cls = `magnetic ${className}`;
  const content = <span ref={inner} className="magnetic-inner">{children}</span>;

  if (href) {
    return (
      <a
        ref={el as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cls}
        data-cursor="link"
        data-sfx
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      ref={el as React.RefObject<HTMLButtonElement>}
      className={cls}
      data-cursor="link"
      data-sfx
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
