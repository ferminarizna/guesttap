"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FeedbackPage() {
  const searchParams = useSearchParams();

  const rating =
    Number(searchParams.get("rating")) || 0;

  const businessId =
    Number(searchParams.get("business")) || 0;

  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function enviarFeedback() {
    if (!mensaje.trim()) return;

    if (!businessId) {
      alert("No se encontró el establecimiento.");
      return;
    }

    const { error } = await supabase
      .from("feedback")
      .insert({
        message: mensaje,
        rating: rating,
        business_id: businessId,
      });

    if (error) {
      console.error(error);
      alert("No se pudo enviar el comentario.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-6">✓</div>

          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Gracias por tu opinión
          </h1>

          <p className="text-gray-600">
            Tu comentario fue enviado al establecimiento.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-md mx-auto">

        <div className="text-center mb-10">
          <div className="text-4xl mb-4">💬</div>

          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Queremos saber qué pasó
          </h1>

          <p className="text-gray-500">
            Tu opinión nos ayuda a mejorar la experiencia.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5">
          <label
            htmlFor="feedback"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            ¿Qué podríamos mejorar?
          </label>

          <textarea
            id="feedback"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Contanos qué pasó..."
            className="w-full min-h-40 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 resize-none"
          />

          <button
            onClick={enviarFeedback}
            disabled={!mensaje.trim()}
            className="w-full mt-4 rounded-xl bg-black text-white py-4 font-medium disabled:opacity-40"
          >
            Enviar comentario
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by GuestTap
        </p>

      </div>
    </main>
  );
}