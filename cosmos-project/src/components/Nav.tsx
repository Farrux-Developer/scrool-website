const LINKS = ['Missions', 'Fleet', 'Crew', 'Journal']

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-100 flex items-center justify-between px-6 py-5 md:px-10">
      <a href="/" className="font-display italic text-2xl text-white">
        Helion
      </a>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-md md:flex">
        {LINKS.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="rounded-full px-4 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            {link}
          </a>
        ))}
      </nav>

      <button className="hidden rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 md:block">
        Reserve a seat
      </button>
    </header>
  )
}
