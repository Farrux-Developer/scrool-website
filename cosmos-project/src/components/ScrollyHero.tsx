import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'

/** Timestamp (s) where clip 1 (push-in to helmet) ends inside scrub.mp4. */
export const CLIP1_END = 8.0417
/** Full duration of scrub.mp4 — fallback until metadata loads. */
const FALLBACK_DURATION = 18.0833

/** Map pinned-section progress (0–1) to video time per the story script. */
function progressToTime(p: number, duration: number): number {
  if (p <= 0.01) return 0
  if (p < 0.4) return ((p - 0.01) / 0.39) * CLIP1_END
  if (p < 0.63) return CLIP1_END
  if (p < 0.92) return CLIP1_END + ((p - 0.63) / 0.29) * (duration - CLIP1_END)
  return duration
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
/** Approximation of cubic-bezier(0.16,1,0.3,1) — fast out, long settle. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Scroll-mapped reveal: element pours in across [start, start+span] of a
 *  hold-progress value. Fully reversible — scrolling back pours it out. */
function rev(hp: number, start: number, span = 0.18, dy = 24, blur = 8): CSSProperties {
  const e = easeOut(clamp01((hp - start) / span))
  return {
    opacity: e,
    transform: `translateY(${(dy * (1 - e)).toFixed(2)}px)`,
    filter: `blur(${(blur * (1 - e)).toFixed(2)}px)`,
  }
}

/** Block B focus-pull variant: deeper offset, heavy blur-to-sharp. */
const revB = (hp: number, start: number, span = 0.18) => rev(hp, start, span, 28, 14)

/** Per-word scroll-mapped cascade for headings. */
function Words({
  text,
  hp,
  start,
  step = 0.08,
  span = 0.18,
  dy = 24,
  blur = 8,
}: {
  text: string
  hp: number
  start: number
  step?: number
  span?: number
  dy?: number
  blur?: number
}) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          <span className="inline-block" style={rev(hp, start + i * step, span, dy, blur)}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  )
}

function Stat({ value, label, style }: { value: string; label: string; style: CSSProperties }) {
  return (
    <div style={style}>
      <div className="font-display text-2xl italic text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  )
}

export default function ScrollyHero() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introRef = useRef<HTMLVideoElement>(null)
  const currentTimeRef = useRef(0)

  const [loaded, setLoaded] = useState(false)
  const [p, setP] = useState(0)

  // Idle intro layer: ambient loop over the frozen first frame. Fades out fast
  // on first scroll input; fades back in only after the lerped scrub time has
  // settled at the start, always restarting from frame 0 (pixel-identical to
  // scrub frame 0) so the handoff never jumps.
  const [introOn, setIntroOn] = useState(true)
  useEffect(() => {
    const intro = introRef.current
    if (!intro) return
    if (introOn) {
      intro.currentTime = 0
      intro.play().catch(() => {})
      return
    }
    // let the 0.4s crossfade finish before freezing the loop
    const t = setTimeout(() => intro.pause(), 450)
    return () => clearTimeout(t)
  }, [introOn])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onReady = () => setLoaded(true)
    if (video.readyState >= 4) onReady()
    video.addEventListener('canplaythrough', onReady, { once: true })

    let raf = 0
    const tick = () => {
      const wrapper = wrapperRef.current
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        const scrollable = rect.height - window.innerHeight
        const progress = clamp01(-rect.top / scrollable)

        // quantized so React only re-renders when progress visibly moves
        setP(Math.round(progress * 1000) / 1000)

        // intro re-entry waits for the scrub lerp to settle at the start
        setIntroOn(progress < 0.003 && currentTimeRef.current < 0.05)

        // Scrub with inertia: lerp currentTime toward the mapped target
        const duration = video.duration || FALLBACK_DURATION
        const target = progressToTime(progress, duration)
        const cur = currentTimeRef.current
        const next = cur + (target - cur) * 0.1
        if (Math.abs(next - cur) > 0.0005) {
          currentTimeRef.current = next
          video.currentTime = next
        } else if (cur !== target) {
          currentTimeRef.current = target
          video.currentTime = target
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('canplaythrough', onReady)
    }
  }, [])

  const blockA = p < 0.01

  // Block B: cascade pours in across p 0.40→0.52, reading window to 0.59,
  // then a long gentle exit (fade + 20px upward drift) across 0.59→0.65
  const hpB = clamp01((p - 0.4) / 0.12)
  const fadeB = p < 0.59 ? 1 : 1 - clamp01((p - 0.59) / 0.06)

  // Block C: cascade pours in across p 0.92→1.0
  const hpC = clamp01((p - 0.92) / 0.08)

  return (
    <div ref={wrapperRef} className="relative h-[600vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-black grain">
        <video
          ref={videoRef}
          src="/scrub.mp4"
          poster="/poster_start.jpg"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Idle intro: ambient ping-pong loop of the first frame, above scrub, below text */}
        <video
          ref={introRef}
          src="/intro_loop.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 z-20 h-full w-full object-cover object-center"
          style={{
            opacity: introOn ? 1 : 0,
            transition: introOn ? 'opacity 0.6s ease-in-out' : 'opacity 0.4s ease-out',
          }}
        />

        {/* Warm vignette glow behind the finale figure */}
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(ellipse_55%_45%_at_50%_100%,rgba(232,160,74,0.14),transparent_70%)]"
          style={{ opacity: hpC * 0.45 }}
        />

        {/* Mobile readability scrims — text sits directly over the figure on small screens */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-1/2 bg-gradient-to-t from-black/70 to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-2/5 bg-gradient-to-b from-black/60 to-transparent md:hidden" />

        {/* Loading state until the video can play through */}
        <div
          className={`absolute inset-0 z-[60] flex items-center justify-center bg-black transition-opacity duration-700 ${
            loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-24 overflow-hidden bg-white/20">
              <div className="h-full w-1/2 animate-pulse bg-white/80" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Helion</span>
          </div>
        </div>

        {/* ——— Block A: split hero — astronaut clear in the center, text at the sides ——— */}
        <div
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          className={`pointer-events-none absolute inset-0 z-50 transition-all duration-700 ${
            blockA ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-[6px] -translate-y-10'
          }`}
        >
          {/* Left: main headline */}
          <div className="absolute max-w-[420px] text-left max-md:inset-x-0 max-md:top-[14%] max-md:px-6 md:left-[7%] md:top-[22%]">
            <h1 className="text-5xl font-light leading-[1.0] tracking-[-0.03em] text-white md:text-7xl">
              Beyond
              <br />
              <span className="font-display italic">the edge</span>
              <br />
              of space.
            </h1>
            <p className="mt-6 max-w-[280px] text-sm text-white/60 max-md:text-white/80 max-md:[text-shadow:0_1px_14px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.8)]">
              Helion charts the silence between worlds — one impossible journey at a time.
            </p>
          </div>

          {/* Right: tagline */}
          <div className="absolute right-[7%] top-[22%] hidden max-w-[300px] text-left md:block">
            <h3 className="text-2xl font-light tracking-[-0.02em] text-white md:text-3xl">
              Explore the <span className="font-display italic">vastness</span>
            </h3>
            <p className="mt-4 text-[11px] uppercase tracking-wide text-white/50">
              Welcome to a world of discovery and boundless horizons. Our mission is to take you
              where maps end.
            </p>
          </div>

          {/* Bottom-right: date accent */}
          <div className="absolute bottom-[14%] right-[7%] text-right">
            <p className="text-4xl font-light leading-tight tracking-[-0.02em] text-white md:text-5xl">
              First voyage
              <br />
              <span className="font-display italic">2027</span>
            </p>
          </div>
        </div>
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-8 z-50 flex justify-center transition-opacity duration-700 ${
            blockA ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronDown className="h-5 w-5 animate-bounce-slow text-white/50" />
        </div>

        {/* ——— Block B: helmet close-up hold — mission briefing on the right ——— */}
        <div
          className="pointer-events-none absolute z-50 max-md:inset-x-0 max-md:bottom-[8%] max-md:px-6 md:right-[8%] md:top-1/2 md:max-w-[460px] md:-translate-y-1/2"
          style={{ opacity: fadeB, visibility: hpB > 0 && fadeB > 0 ? 'visible' : 'hidden' }}
        >
          {/* inner wrapper carries the exit drift so positioning transforms stay intact */}
          <div style={{ transform: `translateY(${(-20 * (1 - fadeB)).toFixed(2)}px)` }}>
            <p
              className="text-[11px] uppercase tracking-[0.3em] text-white/40"
              style={revB(hpB, 0)}
            >
              Mission 04 — First Contact
            </p>

            <h2 className="mt-4 text-5xl font-light leading-[1.05] tracking-[-0.02em] text-white md:text-6xl">
              <Words text="He saw" hp={hpB} start={0.1} dy={28} blur={14} />
              <br />
              <span>
                <span className="inline-block" style={revB(hpB, 0.26)}>
                  it
                </span>{' '}
                <span className="inline-block font-display italic" style={revB(hpB, 0.34)}>
                  first
                </span>
              </span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-white/80" style={revB(hpB, 0.44)}>
              Reflected in his visor: a world no one has named. Ninety million kilometres of cold
              dark, and still — it looked close enough to touch.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-white/55" style={revB(hpB, 0.54)}>
              Every instrument said the same thing: turn back. The fuel margins, the radiation
              curve, the silence on every channel. He stayed another orbit anyway — some things
              you measure, and some things you witness.
            </p>

            <div className="mt-6 h-px w-12 bg-white/20" style={revB(hpB, 0.64)} />

            <div className="mt-5 flex gap-10">
              <Stat value="92M km" label="distance" style={revB(hpB, 0.68)} />
              <Stat value="311 days" label="outbound" style={revB(hpB, 0.75)} />
              <Stat value="1 of 12" label="crew" style={revB(hpB, 0.82)} />
            </div>
          </div>
        </div>

        {/* ——— Block C: finale — editorial layout around the small figure ——— */}
        <div
          className="pointer-events-none absolute inset-0 z-50"
          style={{ visibility: hpC > 0 ? 'visible' : 'hidden' }}
        >
          {/* Hero headline above the planet */}
          <h2 className="absolute inset-x-0 top-[10%] px-6 text-center text-5xl font-light leading-[1.02] tracking-[-0.02em] text-white max-md:top-[12%] md:text-7xl">
            <Words text="Distance is just" hp={hpC} start={0} step={0.06} />
            <br />
            <span className="font-display italic">
              <Words text="a story we tell" hp={hpC} start={0.18} step={0.06} />
            </span>
          </h2>

          {/* Columns: flank the figure on desktop, stack above the bottom on mobile */}
          <div className="max-md:absolute max-md:inset-x-0 max-md:bottom-[6%] max-md:flex max-md:flex-col max-md:gap-7 max-md:px-6 md:contents">
            {/* Left column */}
            <div className="md:absolute md:bottom-[16%] md:left-[7%] md:max-w-[300px]">
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-white/40"
                style={rev(hpC, 0.3)}
              >
                The First Civilian Voyage
              </p>
              <p className="mt-3 text-sm text-white/65" style={rev(hpC, 0.38)}>
                Every expedition begins the same way: someone stands still long enough to really
                look.
              </p>
              <div className="mt-5 h-px w-12 bg-white/20" style={rev(hpC, 0.46)} />
              <div className="mt-4 flex gap-10">
                <Stat value="12" label="seats" style={rev(hpC, 0.52)} />
                <Stat value="2027" label="departure" style={rev(hpC, 0.6)} />
              </div>
            </div>

            {/* Right column */}
            <div className="md:absolute md:bottom-[16%] md:right-[7%] md:max-w-[320px]">
              <p className="text-sm text-white/65" style={rev(hpC, 0.4)}>
                Join the first voyage beyond the belt. One horizon that will never look the same.
              </p>
              <div style={rev(hpC, 0.52)}>
                <button className="group pointer-events-auto mt-6 flex items-center gap-3 rounded-full bg-[#e8a04a] py-2 pl-7 pr-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.03] hover:bg-[#d68d35] hover:shadow-[0_10px_40px_-10px_rgba(232,160,74,0.5)]">
                  Reserve your seat
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/85 transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight size={16} className="text-[#e8a04a]" />
                  </span>
                </button>
              </div>
              <div style={rev(hpC, 0.62)}>
                <a
                  href="#route"
                  className="pointer-events-auto mt-4 inline-block text-xs text-white/50 transition-colors hover:text-white"
                >
                  View the route →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
