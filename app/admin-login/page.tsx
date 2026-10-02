"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function iniciarSesion() {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) {
        console.error(
          "Error iniciando sesión:",
          signInError
        );

        setError("Email o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      if (!data.session || !data.user) {
        setError(
          "No se pudo iniciar la sesión. Intentá nuevamente."
        );
        setLoading(false);
        return;
      }

      /*
       * La autorización de administrador se realiza
       * en el servidor mediante proxy.ts.
       */
      window.location.href = "/admin";
    } catch (error) {
      console.error(
        "Error inesperado iniciando sesión:",
        error
      );

      setError(
        "Ocurrió un error al iniciar sesión. Intentá nuevamente."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            GuestTap
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Panel de administración
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  email &&
                  password &&
                  !loading
                ) {
                  iniciarSesion();
                }
              }}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={iniciarSesion}
            disabled={!email || !password || loading}
            className="mt-6 w-full rounded-xl bg-black py-4 font-medium text-white disabled:opacity-40"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </main>
  );
}