"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CabanasBarranca() {
  const router = useRouter();

  async function elegirValoracion(rating: number) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", "cabanas-barranca")
      .single();

    if (error || !data) {
      alert("No se pudo encontrar el establecimiento.");
      return;
    }

    router.push(`/feedback?rating=${rating}&business=${data.id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">

        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white">
            CB
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Cabañas de la Barranca
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

            <button
              onClick={() => elegirValoracion(5)}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50"
            >
              ⭐ Excelente
            </button>

            <button
              onClick={() => elegirValoracion(4)}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50"
            >
              🙂 Buena
            </button>

            <button
              onClick={() => elegirValoracion(3)}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50"
            >
              😐 Regular
            </button>

            <button
              onClick={() => elegirValoracion(1)}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50"
            >
              😞 Mala
            </button>

          </div>
        </div>

        <p className="mt-auto pt-10 text-center text-xs text-neutral-400">
          Powered by GuestTap
        </p>

      </section>
    </main>
  );
}