"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ActivarCuentaPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function comprobarSesion() {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));

        if (params.has("error")) {
          const description = params.get("error_description");
          const errorCode = params.get("error_code");

          if (!mounted) return;

          if (errorCode === "otp_expired") {
            setError(
              "El enlace venció o ya fue utilizado. Solicitá uno nuevo."
            );
          } else {
            setError(
              description
                ? decodeURIComponent(description.replace(/\+/g, " "))
                : "El enlace no es válido. Solicitá uno nuevo."
            );
          }

          setLoading(false);
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Error al comprobar la sesión:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (session) {
          setLoading(false);
          return;
        }

        timeout = setTimeout(async () => {
          try {
            const {
              data: { session: currentSession },
              error: currentSessionError,
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (currentSessionError) {
              setError(currentSessionError.message);
            } else if (!currentSession) {
              setError(
                "No encontramos una sesión válida. Solicitá un nuevo enlace y abrilo en el mismo navegador donde lo pediste."
              );
            }

            setLoading(false);
          } catch (err) {
            if (!mounted) return;

            console.error("Error comprobando el acceso:", err);
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo comprobar la sesión."
            );
            setLoading(false);
          }
        }, 1500);
      } catch (err) {
        if (!mounted) return;

        console.error("Error al validar el enlace:", err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo validar el enlace."
        );
        setLoading(false);
      }
    }

    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION")
      ) {
        setLoading(false);
        setError("");
      }
    });

    return () => {
      mounted = false;

      if (timeout) {
        clearTimeout(timeout);
      }

      subscription.unsubscribe();
    };
  }, []);

  async function crearPassword() {
    if (saving) return;

    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error(
          "Tu sesión de recuperación venció o no se pudo validar. Solicitá un enlace nuevo."
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Error real al cambiar la contraseña:", updateError);
        throw updateError;
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.warn("No se pudo cerrar la sesión anterior:", signOutError);
      }

      router.replace("/panel-login");
    } catch (err) {
      console.error("Error al establecer la contraseña:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al establecer la contraseña."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <p className="text-sm text-neutral-500">
          Verificando acceso...
        </p>
      </main>
    );
  }

  if (error && !password && !confirmPassword) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-2xl font-semibold">
            No se pudo validar el acceso
          </h1>

          <p className="mt-3 break-words text-sm leading-6 text-red-600">
            {error}
          </p>

          <a
            href="/recuperar"
            className="mt-6 inline-flex w-full justify-center rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Solicitar otro enlace
          </a>
        </div>
      </main>
    );
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
            Crear contraseña
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Elegí una contraseña para acceder al panel de tu negocio.
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            crearPassword();
          }}
        >
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700"
            >
              Contraseña nueva
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-neutral-700"
            >
              Repetir contraseña
            </label>

            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí tu contraseña"
              required
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="break-words text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}