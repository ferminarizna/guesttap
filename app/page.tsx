export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white shadow-lg">
          G
        </div>

        <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
          GuestTap
        </p>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          La experiencia de tus huéspedes,
          <span className="block text-neutral-500">
            a un solo toque.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          QR y NFC para que tus clientes puedan dejar su opinión
          y encontrar fácilmente dónde compartir su experiencia.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800">
            Quiero conocer GuestTap
          </button>

          <button className="rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-medium transition hover:bg-neutral-100">
            Ver cómo funciona
          </button>
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-2xl">⌁</div>
            <h2 className="mt-4 font-semibold">NFC</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              El huésped acerca su teléfono y entra automáticamente.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-2xl">▦</div>
            <h2 className="mt-4 font-semibold">QR</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Un código simple para colocar en mesas, habitaciones o recepción.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-2xl">★</div>
            <h2 className="mt-4 font-semibold">Opiniones</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Una experiencia diseñada para facilitar el feedback del cliente.
            </p>
          </div>
        </div>

        <p className="mt-16 text-xs text-neutral-400">
          GuestTap · Experiencias digitales para hoteles y locales
        </p>
      </section>
    </main>
  );
}
