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

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">

        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white">
            {business.name.substring(0, 2).toUpperCase()}
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            {business.name}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Gracias por hospedarte con nosotros
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">

          <h2 className="text-center text-xl font-semibold">
            ¿Cómo fue tu experiencia?
          </h2>

          <p className="mt-2 text-center text-sm text-neutral-500">
            Tu opinión nos ayuda a seguir mejorando.
          </p>

          <div className="mt-8 space-y-3">

            <a
              href={`/feedback?rating=5&business=${business.id}`}
              className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              ⭐ Excelente
            </a>

            <a
              href={`/feedback?rating=4&business=${business.id}`}
              className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              🙂 Buena
            </a>

            <a
              href={`/feedback?rating=3&business=${business.id}`}
              className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              😐 Regular
            </a>

            <a
              href={`/feedback?rating=2&business=${business.id}`}
              className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              😞 Mala
            </a>

          </div>
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-neutral-400">
          Powered by GuestTap
        </p><div className="mt-6 space-y-3">

  {business.google_url && (
    <a
      href={business.google_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl bg-black p-4 text-center font-medium text-white"
    >
      ⭐ Dejar reseña en Google
    </a>
  )}

  {business.instagram_url && (
    <a
      href={business.instagram_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 text-center font-medium"
    >
      Instagram
    </a>
  )}

  {business.whatsapp && (
    <a
      href={business.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-2xl border border-neutral-200 bg-white p-4 text-center font-medium"
    >
      WhatsApp
    </a>
  )}

</div>

      </section>
    </main>
  );
}