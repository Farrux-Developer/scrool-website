import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import Nav from './components/Nav'
import ScrollyHero from './components/ScrollyHero'
import StaticHero from './components/StaticHero'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis()
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reducedMotion])

  return (
    <div className="bg-black">
      <Nav />
      {reducedMotion ? <StaticHero /> : <ScrollyHero />}
    </div>
  )
}
