    "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PanelLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion() {
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresá tu email y contraseña.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError || !data.user) {
      console.error(loginError);
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: businessUser, error: businessError } =
      await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

    if (businessError || !businessUser) {
      await supabase.auth.signOut();

      setError(
        "Esta cuenta todavía no tiene un negocio asociado."
      );

      setLoading(false);
      return;
    }

    router.replace("/panel");
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
            Administrá la experiencia y el feedback de tu negocio.
          </p>
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium text-neutral-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />

          <label className="mt-5 block text-sm font-medium text-neutral-700">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                iniciarSesion();
              }
            }}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
          />

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={iniciarSesion}
            disabled={loading}
            className="mt-5 w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <button
            onClick={() => router.push("/recuperar")}
            className="mt-4 w-full text-center text-sm text-neutral-400 transition hover:text-neutral-700"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          GuestTap · Panel para negocios
        </p>
      </div>
    </main>
  );
}