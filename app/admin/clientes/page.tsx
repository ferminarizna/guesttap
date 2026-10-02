"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  email: string | null;
  created_at: string;
  email_confirmed_at: string | null;
};

type Business = {
  id: number;
  name: string;
};

type Association = {
  id: number;
  user_id: string;
  business_id: number;
  created_at: string;
};

export default function ClientesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  }

  async function cargarDatos() {
    setLoading(true);
    setError("");

    try {
      const session = await obtenerSesion();

      if (!session) {
        setError("No hay una sesión de administrador activa.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/business-users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "No se pudieron cargar los datos.");
        setLoading(false);
        return;
      }

      setUsers(result.users || []);
      setBusinesses(result.businesses || []);
      setAssociations(result.associations || []);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al cargar los datos.");
    }

    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function asociarCliente() {
    setMessage("");
    setError("");

    if (!selectedUser || !selectedBusiness) {
      setError("Seleccioná un cliente y un negocio.");
      return;
    }

    setSaving(true);

    try {
      const session = await obtenerSesion();

      if (!session) {
        setError("La sesión expiró. Volvé a iniciar sesión.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/admin/business-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser,
          business_id: Number(selectedBusiness),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "No se pudo asociar el cliente.");
        setSaving(false);
        return;
      }

      const usuario = users.find((user) => user.id === selectedUser);
      const negocio = businesses.find(
        (business) => business.id === Number(selectedBusiness)
      );

      setMessage(
        `${usuario?.email || "Cliente"} quedó asociado a ${
          negocio?.name || "el negocio"
        }.`
      );

      setSelectedUser("");
      setSelectedBusiness("");

      await cargarDatos();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al asociar el cliente.");
    }

    setSaving(false);
  }

  async function desasociarCliente(association: Association) {
    const usuario = users.find(
      (user) => user.id === association.user_id
    );

    const negocio = businesses.find(
      (business) => business.id === association.business_id
    );

    const confirmado = window.confirm(
      `¿Seguro que querés desasociar ${
        usuario?.email || "este cliente"
      } de ${negocio?.name || "este negocio"}?`
    );

    if (!confirmado) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(association.id);

    try {
      const session = await obtenerSesion();

      if (!session) {
        setError("La sesión expiró. Volvé a iniciar sesión.");
        setDeletingId(null);
        return;
      }

      const response = await fetch("/api/admin/business-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: association.user_id,
          business_id: association.business_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "No se pudo eliminar la asociación."
        );
        setDeletingId(null);
        return;
      }

      setMessage(
        `${usuario?.email || "Cliente"} fue desasociado de ${
          negocio?.name || "el negocio"
        }.`
      );

      await cargarDatos();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al eliminar la asociación.");
    }

    setDeletingId(null);
  }

  function obtenerEmail(userId: string) {
    return (
      users.find((user) => user.id === userId)?.email ||
      "Usuario desconocido"
    );
  }

  function obtenerNegocio(businessId: number) {
    return (
      businesses.find((business) => business.id === businessId)?.name ||
      "Negocio desconocido"
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-neutral-200 pb-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                G
              </div>

              <span className="text-sm font-semibold tracking-tight">
                GuestTap
              </span>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
            >
              Volver al dashboard
            </Link>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            Clientes
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Administrá qué negocio puede gestionar cada cuenta.
          </p>
        </header>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm">
            Cargando clientes y negocios...
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Asociar cliente
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                El cliente podrá ver y administrar el negocio que le
                asignes.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cliente
                  </label>

                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">
                      Seleccionar cliente...
                    </option>

                    {users
                      .filter(
                        (user) =>
                          user.email !== "ariznafermin@gmail.com"
                      )
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email || user.id}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Negocio
                  </label>

                  <select
                    value={selectedBusiness}
                    onChange={(e) =>
                      setSelectedBusiness(e.target.value)
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">
                      Seleccionar negocio...
                    </option>

                    {businesses.map((business) => (
                      <option
                        key={business.id}
                        value={business.id}
                      >
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                onClick={asociarCliente}
                disabled={
                  !selectedUser ||
                  !selectedBusiness ||
                  saving
                }
                className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Asociando..."
                  : "Asociar cliente"}
              </button>
            </section>

            <section className="mt-8 rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 p-6">
                <h2 className="text-lg font-semibold">
                  Clientes asociados
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Estas son las cuentas que actualmente tienen
                  acceso a un negocio.
                </p>
              </div>

              {associations.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  Todavía no hay clientes asociados.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {associations.map((association) => (
                    <div
                      key={association.id}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {obtenerEmail(association.user_id)}
                        </p>

                        <p className="mt-1 text-sm text-neutral-500">
                          {obtenerNegocio(
                            association.business_id
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          desasociarCliente(association)
                        }
                        disabled={
                          deletingId === association.id
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === association.id
                          ? "Eliminando..."
                          : "Desasociar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}