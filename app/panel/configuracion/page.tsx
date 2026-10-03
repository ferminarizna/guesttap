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

function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "check"
    | "business"
    | "google"
    | "instagram"
    | "whatsapp"
    | "image";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "business") {
    return (
      <svg {...common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
        <path d="M2 21h20" />
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
      </svg>
    );
  }

  if (name === "google") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4h4" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M17.5 6.5h.01" />
      </svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <svg {...common}>
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
        <path d="M9 9.5c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.6.7c.8 1.5 1.8 2.2 3.2 2.7l.6-.8c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.6.9-.5.2-1.2.2-2-.1-2.9-1-5.1-3.2-6-5.9-.2-.7-.2-1.4.3-1.9Z" />
      </svg>
    );
  }

  if (name === "image") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 2.5-2.5L20 17" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

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

    try {
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
        setError(
          "No encontramos un negocio asociado a tu cuenta."
        );
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
    } catch (error) {
      console.error(error);
      setError(
        "Ocurrió un error al cargar la configuración."
      );
      setLoading(false);
    }
  }

  async function guardarCambios(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!business) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("El nombre del negocio es obligatorio.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/panel/configuracion",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            google_url: googleUrl.trim(),
            instagram_url: instagramUrl.trim(),
            whatsapp: whatsapp.trim(),
            logo_url: logoUrl.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Error guardando configuración:",
          result
        );

        setError(
          result.error ||
            "No pudimos guardar los cambios."
        );

        setSaving(false);
        return;
      }

      if (result.business) {
        setBusiness(result.business);

        setName(result.business.name || "");
        setGoogleUrl(
          result.business.google_url || ""
        );
        setInstagramUrl(
          result.business.instagram_url || ""
        );
        setWhatsapp(
          result.business.whatsapp || ""
        );
        setLogoUrl(
          result.business.logo_url || ""
        );
      }

      setMessage(
        "Cambios guardados correctamente."
      );
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error al guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-5 sm:p-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="animate-pulse">
            <div className="h-10 w-48 rounded-xl bg-neutral-200" />

            <div className="mt-7 h-24 rounded-[24px] bg-neutral-100" />

            <div className="mt-5 h-[600px] rounded-[24px] bg-neutral-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-sm">
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
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al panel
            <Icon name="arrow" size={15} />
          </a>
        </div>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">

      {/* HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-7 lg:px-8">

          <div className="flex items-center justify-between py-4 sm:py-5">

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">
                GuestTap
              </p>

              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                Configuración
              </h1>
            </div>

            <a
              href="/panel"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:px-4"
            >
              <span className="hidden sm:inline">
                Volver al panel
              </span>

              <span className="sm:hidden">
                Volver
              </span>

              <Icon name="arrow" size={14} />
            </a>

          </div>

          {/* NAVEGACIÓN */}

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3">

            <a
              href="/panel"
              className="flex shrink-0 items-center rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Resumen
            </a>

            <a
              href="/panel/feedback"
              className="flex shrink-0 items-center rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Feedback
            </a>

            <a
              href="/panel/qr"
              className="flex shrink-0 items-center rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Mi QR
            </a>

            <a
              href="/panel/configuracion"
              className="flex shrink-0 items-center rounded-xl bg-black px-3 py-2.5 text-[11px] font-semibold text-white"
            >
              Configuración
            </a>

          </nav>

        </div>
      </header>

      {/* CONTENIDO */}

      <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-8">

        <div className="mx-auto max-w-[1100px]">

          {/* INTRO */}

          <section>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {business.name}
            </p>

            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] sm:text-4xl">
              Configurá tu negocio
            </h2>

            <p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Administrá la información que tus clientes ven en tu página pública.
            </p>

          </section>

          {/* FORMULARIO */}

          <form
            onSubmit={guardarCambios}
            className="mt-6 overflow-hidden rounded-[24px] border border-neutral-200 bg-white sm:mt-8"
          >

            {/* CABECERA DEL FORM */}

            <div className="border-b border-neutral-200 px-5 py-5 sm:px-7 sm:py-6">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="business" size={18} />
                </div>

                <div>
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                    Información del negocio
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-neutral-500 sm:text-xs">
                    Estos datos se utilizan en tu página pública de GuestTap.
                  </p>
                </div>

              </div>

            </div>

            {/* CAMPOS */}

            <div className="px-5 py-6 sm:px-7 sm:py-7">

              <div className="grid gap-5 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">

                {/* NOMBRE */}

                <div className="lg:col-span-2">

                  <label
                    htmlFor="business-name"
                    className="text-xs font-semibold text-neutral-800"
                  >
                    Nombre del negocio
                  </label>

                  <div className="relative mt-2">

                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Icon name="business" size={16} />
                    </div>

                    <input
                      id="business-name"
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/5"
                      placeholder="Ej: Plantagonia"
                    />

                  </div>

                  <p className="mt-1.5 text-[10px] text-neutral-400">
                    Este nombre aparecerá en tu página pública.
                  </p>

                </div>

                {/* GOOGLE */}

                <div>

                  <label
                    htmlFor="google-url"
                    className="text-xs font-semibold text-neutral-800"
                  >
                    Reseñas de Google
                  </label>

                  <div className="relative mt-2">

                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Icon name="google" size={16} />
                    </div>

                    <input
                      id="google-url"
                      type="url"
                      value={googleUrl}
                      onChange={(e) =>
                        setGoogleUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/5"
                      placeholder="https://g.page/r/..."
                    />

                  </div>

                  <p className="mt-1.5 text-[10px] leading-4 text-neutral-400">
                    Link directo para que tus clientes dejen una reseña.
                  </p>

                </div>

                {/* INSTAGRAM */}

                <div>

                  <label
                    htmlFor="instagram-url"
                    className="text-xs font-semibold text-neutral-800"
                  >
                    Instagram
                  </label>

                  <div className="relative mt-2">

                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Icon name="instagram" size={16} />
                    </div>

                    <input
                      id="instagram-url"
                      type="text"
                      value={instagramUrl}
                      onChange={(e) =>
                        setInstagramUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/5"
                      placeholder="https://instagram.com/tu-negocio"
                    />

                  </div>

                  <p className="mt-1.5 text-[10px] text-neutral-400">
                    Link de tu perfil de Instagram.
                  </p>

                </div>

                {/* WHATSAPP */}

                <div>

                  <label
                    htmlFor="whatsapp"
                    className="text-xs font-semibold text-neutral-800"
                  >
                    WhatsApp
                  </label>

                  <div className="relative mt-2">

                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Icon name="whatsapp" size={16} />
                    </div>

                    <input
                      id="whatsapp"
                      type="text"
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/5"
                      placeholder="Ej: 2901555555"
                    />

                  </div>

                  <p className="mt-1.5 text-[10px] leading-4 text-neutral-400">
                    Podés ingresar solamente el número.
                  </p>

                </div>

                {/* LOGO */}

                <div>

                  <label
                    htmlFor="logo-url"
                    className="text-xs font-semibold text-neutral-800"
                  >
                    Logo
                  </label>

                  <div className="relative mt-2">

                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Icon name="image" size={16} />
                    </div>

                    <input
                      id="logo-url"
                      type="url"
                      value={logoUrl}
                      onChange={(e) =>
                        setLogoUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/5"
                      placeholder="https://..."
                    />

                  </div>

                  <p className="mt-1.5 text-[10px] text-neutral-400">
                    URL pública de la imagen de tu logo.
                  </p>

                </div>

              </div>

            </div>

            {/* MENSAJES */}

            {(error || message) && (
              <div className="border-t border-neutral-200 px-5 py-4 sm:px-7">

                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                    {error}
                  </div>
                )}

                {message && !error && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
                    <Icon name="check" size={15} />
                    {message}
                  </div>
                )}

              </div>
            )}

            {/* FOOTER FORM */}

            <div className="flex flex-col gap-3 border-t border-neutral-200 bg-[#fafaf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">

              <p className="hidden text-[10px] text-neutral-400 sm:block">
                Los cambios se aplican a tu página pública.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[170px]"
              >
                {saving ? (
                  "Guardando..."
                ) : (
                  <>
                    Guardar cambios
                    <Icon name="check" size={15} />
                  </>
                )}
              </button>

            </div>

          </form>

          <footer className="py-8 text-center">
            <p className="text-[9px] text-neutral-400 sm:text-[10px]">
              GuestTap · Panel de gestión
            </p>
          </footer>

        </div>

      </div>

    </main>
  );
}