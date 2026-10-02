"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  google_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  logo_url: string | null;
};

export default function ConfiguracionPage() {
  const [business, setBusiness] = useState<Business | null>(null);

  const [name, setName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay una sesión iniciada.");
      setLoading(false);
      return;
    }

    const { data: businessUser, error: businessUserError } =
      await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (businessUserError || !businessUser) {
      console.error(businessUserError);
      setError("No encontramos un negocio asociado a tu cuenta.");
      setLoading(false);
      return;
    }

    const { data: businessData, error: businessError } =
      await supabase
        .from("businesses")
        .select(
          "id, name, google_url, instagram_url, whatsapp, logo_url"
        )
        .eq("id", businessUser.business_id)
        .single();

    if (businessError || !businessData) {
      console.error(businessError);
      setError("No pudimos cargar la configuración.");
      setLoading(false);
      return;
    }

    setBusiness(businessData);

    setName(businessData.name || "");
    setGoogleUrl(businessData.google_url || "");
    setInstagramUrl(businessData.instagram_url || "");
    setWhatsapp(businessData.whatsapp || "");
    setLogoUrl(businessData.logo_url || "");

    setLoading(false);
  }

  function convertirWhatsApp(valor: string) {
    const texto = valor.trim();

    if (!texto) {
      return null;
    }

    if (texto.startsWith("https://wa.me/")) {
      return texto;
    }

    if (texto.startsWith("http://wa.me/")) {
      return texto.replace("http://", "https://");
    }

    const numero = texto.replace(/\D/g, "");

    if (!numero) {
      return null;
    }

    if (numero.startsWith("549")) {
      return `https://wa.me/${numero}`;
    }

    if (numero.startsWith("54")) {
      return `https://wa.me/${numero}`;
    }

    return `https://wa.me/549${numero}`;
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();

    if (!business) return;

    setSaving(true);
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("El nombre del negocio es obligatorio.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        google_url: googleUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        whatsapp: convertirWhatsApp(whatsapp),
        logo_url: logoUrl.trim() || null,
      })
      .eq("id", business.id);

    if (updateError) {
      console.error(updateError);
      setError("No pudimos guardar los cambios.");
      setSaving(false);
      return;
    }

    setMessage("Cambios guardados correctamente.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-neutral-500">
            Cargando configuración...
          </p>
        </div>
      </main>
    );
  }

  if (error && !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold">
            No pudimos cargar la configuración
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
          </p>

          <a
            href="/panel"
            className="mt-6 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al panel
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-8">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              GuestTap
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              Configuración
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Administrá la información que aparece en tu página.
            </p>
          </div>

          <a
            href="/panel"
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Volver al resumen
          </a>
        </header>

        {/* NAVEGACIÓN */}

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <a
            href="/panel"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Resumen
          </a>

          <a
            href="/panel/feedback"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Feedback
          </a>

          <a
            href="/panel/qr"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Mi QR
          </a>

          <a
            href="/panel/configuracion"
            className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            Configuración
          </a>
        </nav>

        {/* FORMULARIO */}

        <form
          onSubmit={guardarCambios}
          className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
        >
          <div>
            <h2 className="text-lg font-semibold">
              Información del negocio
            </h2>

            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Estos datos se utilizan en tu página pública de GuestTap.
            </p>
          </div>

          <div className="mt-8 space-y-6">

            {/* NOMBRE */}

            <div>
              <label className="text-sm font-medium text-neutral-800">
                Nombre del negocio
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Ej: Plantagonia"
              />
            </div>

            {/* GOOGLE */}

            <div>
              <label className="text-sm font-medium text-neutral-800">
                Link directo de reseñas de Google
              </label>

              <input
                type="url"
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black"
                placeholder="https://g.page/r/..."
              />

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Es el enlace que Google genera para que tus clientes dejen
                una reseña.
              </p>
            </div>

            {/* INSTAGRAM */}

            <div>
              <label className="text-sm font-medium text-neutral-800">
                Instagram
              </label>

              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black"
                placeholder="https://instagram.com/tu-negocio"
              />
            </div>

            {/* WHATSAPP */}

            <div>
              <label className="text-sm font-medium text-neutral-800">
                WhatsApp
              </label>

              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Ej: 2901555555"
              />

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Podés ingresar solamente el número. GuestTap lo convierte
                automáticamente en un enlace de WhatsApp.
              </p>
            </div>

            {/* LOGO */}

            <div>
              <label className="text-sm font-medium text-neutral-800">
                URL del logo
              </label>

              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-black"
                placeholder="https://..."
              />

              <p className="mt-2 text-xs leading-5 text-neutral-400">
                Pegá la URL pública de la imagen de tu logo.
              </p>
            </div>
          </div>

          {/* MENSAJES */}

          {error && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* BOTÓN */}

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </main>
  );
}