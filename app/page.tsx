export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      {/* Ambient aurora glow */}
      <div className="aurora" />
      {/* Futuristic grid overlay */}
      <div className="grid-overlay" />
      {/* Soft scanline sheen */}
      <div className="scanlines" />
      
      {/* Centered title */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center isolate">
        <div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 text-glow">
            Hearing Decoded
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-slate-300/90">
            Exploring the future of sound and storytelling.
          </p>
          <div className="mt-10">
            <a
              href="https://hearingdecoded.com/episode/hidden-dangers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-indigo-600/30 hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span>Watch the Latest Episode</span>
              <span aria-hidden>▶</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
