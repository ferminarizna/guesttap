import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, name, slug, google_url, instagram_url, whatsapp, logo_url")
    .eq("slug", slug)
    .single();

  if (error || !business) {
    notFound();
  }

  const iniciales = business.name
    .split(" ")
    .slice(0, 2)
    .map((palabra: string) => palabra[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">

        {/* ENCABEZADO */}
        <div className="text-center">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`Logo de ${business.name}`}
              className="mx-auto h-24 w-24 rounded-3xl object-cover shadow-sm"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-black text-2xl font-semibold text-white shadow-sm">
              {iniciales}
            </div>
          )}

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {business.name}
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Tu opinión nos importa
          </p>
        </div>

        {/* VALORACIÓN */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-center text-xl font-semibold tracking-tight">
            ¿Cómo fue tu experiencia?
          </h2>

          <p className="mt-2 text-center text-sm leading-5 text-neutral-500">
            Elegí una opción para contarnos cómo te fue.
          </p>

          <div className="mt-7 space-y-3">
            <a
              href={`/feedback?rating=5&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">
                Excelente
              </span>

              <span className="text-lg">
                ⭐⭐⭐⭐⭐
              </span>
            </a>

            <a
              href={`/feedback?rating=4&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">
                Muy buena
              </span>

              <span className="text-lg">
                ⭐⭐⭐⭐
              </span>
            </a>

            <a
              href={`/feedback?rating=3&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">
                Buena
              </span>

              <span className="text-lg">
                ⭐⭐⭐
              </span>
            </a>

            <a
              href={`/feedback?rating=2&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">
                Puede mejorar
              </span>

              <span className="text-lg">
                ⭐⭐
              </span>
            </a>
          </div>
        </div>

        {/* ENLACES */}
        {(business.google_url ||
          business.instagram_url ||
          business.whatsapp) && (
          <div className="mt-6 space-y-3">
            {business.google_url && (
              <a
                href={business.google_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-black px-5 py-4 text-center text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                ⭐ Dejar reseña en Google
              </a>
            )}

            {business.instagram_url && (
              <a
                href={business.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-center text-sm font-medium transition hover:bg-neutral-50 active:scale-[0.99]"
              >
                Instagram
              </a>
            )}

            {business.whatsapp && (
              <a
                href={business.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-center text-sm font-medium transition hover:bg-neutral-50 active:scale-[0.99]"
              >
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-auto pt-10 text-center">
          <p className="text-xs text-neutral-400">
            Powered by GuestTap
          </p>
        </div>

      </section>
    </main>
  );
}