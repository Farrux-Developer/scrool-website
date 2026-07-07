import { ArrowUpRight } from 'lucide-react'

/** prefers-reduced-motion fallback: no pinning, no scrub —
 *  static final frame with all story text visible. */
export default function StaticHero() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black grain">
      <img
        src="/poster_end.jpg"
        alt="An astronaut stands before a giant ringed planet"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-50 mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-12 px-6 py-32 text-center">
        <div>
          <h1 className="text-5xl font-light leading-[1.0] tracking-[-0.03em] text-white sm:text-7xl">
            Beyond
            <br />
            <span className="font-display italic">the edge</span>
            <br />
            of space.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm text-white/60">
            Helion charts the silence between worlds — one impossible journey at a time.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            Mission 04 — First Contact
          </p>
          <h2 className="mt-3 text-3xl font-light tracking-[-0.02em] text-white">
            He saw <span className="font-display italic">it first</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Reflected in his visor: a world no one has named. Ninety million kilometres of cold
            dark, and still — it looked close enough to touch.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-light leading-[1.02] tracking-[-0.02em] text-white sm:text-4xl">
            Distance is just <span className="font-display italic">a story we tell</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/65">
            Join the first voyage beyond the belt. One horizon that will never look the same.
          </p>
          <button className="group mx-auto mt-8 flex items-center gap-3 rounded-full bg-[#e8a04a] py-2 pl-7 pr-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.03] hover:bg-[#d68d35] hover:shadow-[0_10px_40px_-10px_rgba(232,160,74,0.5)]">
            Reserve your seat
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/85 transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight size={16} className="text-[#e8a04a]" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
