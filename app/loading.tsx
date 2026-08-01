export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-black/80 px-6 text-center text-white">
      <section className="glass-card rounded-3xl p-8">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-lime-300/20 border-t-lime-300 page-spinner" />
        <p className="mt-5 font-mono text-xs font-black uppercase tracking-[0.28em] text-lime-200">Loading AegisLua</p>
      </section>
    </main>
  );
}
