"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

const REDIRECT_URL =
  "https://guesttap-five.vercel.app/activar-cuenta";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function enviar() {
    setError("");

    if (!email.trim()) {
      setError("Ingresá tu email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: REDIRECT_URL,
      }
    );

    if (error) {
      console.error(error);
      setError("No se pudo enviar el enlace.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
          G
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            GuestTap
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Acceder al panel
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Ingresá tu email y te enviaremos un enlace para establecer tu
            contraseña.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl bg-neutral-50 p-5 text-center">
            <p className="text-sm font-medium text-neutral-900">
              Revisá tu email.
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Te enviamos un enlace para continuar.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <label className="text-sm font-medium text-neutral-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            />

            {error && (
              <p className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={enviar}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}