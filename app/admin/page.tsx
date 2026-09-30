"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
  google_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
};

export default function AdminPage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [feedbackCounts, setFeedbackCounts] = useState<Record<number, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  async function cargarNegocios() {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, slug, google_url, instagram_url, whatsapp")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setBusinesses(data || []);

    const { data: countsData, error: countsError } =
      await supabase.rpc("get_feedback_counts");

    if (countsError) {
      console.error(countsError);
      return;
    }

    const counts: Record<number, number> = {};

    (countsData || []).forEach((item: { business_id: number; feedback_count: number }) => {
      counts[item.business_id] = Number(item.feedback_count);
    });

    setFeedbackCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    cargarNegocios();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/admin-login");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-5xl">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Administrá tus negocios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/crear-negocio"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              + Nuevo negocio
            </Link>

            <button
              onClick={cerrarSesion}
              className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium hover:bg-neutral-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">

          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              Cargando negocios...
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              Todavía no hay negocios.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">

              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between gap-4 p-5"
                >

                  <div>
                    <h2 className="font-medium">
                      {business.name}
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      /{business.slug}
                    </p>

                    <p className="mt-2 text-sm font-medium text-neutral-700">
                      💬 {feedbackCounts[business.id] || 0} feedback
                    </p>
                  </div>

                  <div className="flex items-center gap-2">

                    <Link
                      href={`/admin/qr/${business.id}`}
                      className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                    >
                      QR
                    </Link>

                    <Link
                      href={`/admin/editar-negocio/${business.id}`}
                      className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/admin/feedback/${business.id}`}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      Ver feedback
                    </Link>

                    <a
                      href={`/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                    >
                      Ver página
                    </a>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}