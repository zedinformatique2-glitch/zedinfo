"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ar } from "@/lib/admin-i18n";

type CarrierDoc = {
  _id: any;
  slug: string;
  name: string;
  enabled: boolean;
  credentials?: {
    apiId?: string;
    apiToken?: string;
    bearerToken?: string;
  };
  isDefault: boolean;
  hasApi: boolean;
  verified?: boolean;
};

const CREDENTIAL_FIELDS: Record<string, { label: string; field: "apiId" | "apiToken" | "bearerToken" }[]> = {
  yalidine: [
    { label: "API ID", field: "apiId" },
    { label: "API Token", field: "apiToken" },
  ],
  zr_express: [
    { label: "API ID", field: "apiId" },
    { label: "API Token", field: "apiToken" },
  ],
  maystro: [
    { label: "Bearer Token", field: "bearerToken" },
  ],
  ecotrack: [
    { label: "Bearer Token", field: "bearerToken" },
  ],
};

export default function AdminDeliveryPage() {
  const carriers = useQuery(api.delivery.list) as CarrierDoc[] | undefined;
  const upsert = useMutation(api.delivery.upsert);
  const seedDefaults = useMutation(api.delivery.seedDefaults);
  const testConnection = useAction(api.delivery.testConnection);

  const [editingCreds, setEditingCreds] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (carriers && carriers.length === 0 && !seeded) {
      setSeeded(true);
      seedDefaults({});
    }
  }, [carriers, seeded, seedDefaults]);

  useEffect(() => {
    if (!carriers) return;
    const initial: Record<string, Record<string, string>> = {};
    for (const c of carriers) {
      if (!editingCreds[c.slug]) {
        initial[c.slug] = {
          apiId: c.credentials?.apiId ?? "",
          apiToken: c.credentials?.apiToken ?? "",
          bearerToken: c.credentials?.bearerToken ?? "",
        };
      }
    }
    if (Object.keys(initial).length > 0) {
      setEditingCreds((prev) => ({ ...initial, ...prev }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carriers]);

  if (!carriers) return <div className="p-8">{ar.dashboard.loading}</div>;

  const handleToggle = async (carrier: CarrierDoc) => {
    await upsert({
      slug: carrier.slug,
      name: carrier.name,
      enabled: !carrier.enabled,
      credentials: carrier.credentials,
      isDefault: carrier.isDefault,
      hasApi: carrier.hasApi,
    });
  };

  const handleSetDefault = async (carrier: CarrierDoc) => {
    await upsert({
      slug: carrier.slug,
      name: carrier.name,
      enabled: carrier.enabled,
      credentials: carrier.credentials,
      isDefault: true,
      hasApi: carrier.hasApi,
    });
  };

  const handleSaveCredentials = async (carrier: CarrierDoc) => {
    const creds = editingCreds[carrier.slug] || {};
    setSaving((p) => ({ ...p, [carrier.slug]: true }));
    await upsert({
      slug: carrier.slug,
      name: carrier.name,
      enabled: carrier.enabled,
      credentials: {
        apiId: creds.apiId || undefined,
        apiToken: creds.apiToken || undefined,
        bearerToken: creds.bearerToken || undefined,
      },
      isDefault: carrier.isDefault,
      hasApi: carrier.hasApi,
    });
    setSaving((p) => ({ ...p, [carrier.slug]: false }));
  };

  const handleTest = async (carrier: CarrierDoc) => {
    const creds = editingCreds[carrier.slug] || {};
    setTesting((p) => ({ ...p, [carrier.slug]: true }));
    setTestResults((p) => ({ ...p, [carrier.slug]: undefined as any }));
    try {
      const result = await testConnection({
        slug: carrier.slug,
        credentials: {
          apiId: creds.apiId || undefined,
          apiToken: creds.apiToken || undefined,
          bearerToken: creds.bearerToken || undefined,
        },
      });
      setTestResults((p) => ({ ...p, [carrier.slug]: result }));
    } catch (e: any) {
      setTestResults((p) => ({ ...p, [carrier.slug]: { success: false, error: e.message } }));
    }
    setTesting((p) => ({ ...p, [carrier.slug]: false }));
  };

  const setCredField = (slug: string, field: string, value: string) => {
    setEditingCreds((p) => ({
      ...p,
      [slug]: { ...(p[slug] || {}), [field]: value },
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          {ar.deliveryPage.settings}
        </div>
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter">{ar.deliveryPage.title}</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          {ar.deliveryPage.subtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {carriers.map((carrier) => {
          const fields = CREDENTIAL_FIELDS[carrier.slug];
          const creds = editingCreds[carrier.slug] || {};
          const isTesting = testing[carrier.slug];
          const testResult = testResults[carrier.slug];
          const isSaving = saving[carrier.slug];

          return (
            <div
              key={carrier.slug}
              className="bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-primary via-primary-container to-primary" />

              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="font-black uppercase tracking-tight">{carrier.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {carrier.hasApi ? (
                      <span className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                        {ar.deliveryPage.api}
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-widest bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-lg font-bold">
                        {ar.deliveryPage.manual}
                      </span>
                    )}
                    {carrier.isDefault && (
                      <span className="text-[9px] uppercase tracking-widest bg-green-100 text-green-800 px-2 py-0.5 rounded-lg font-bold">
                        {ar.deliveryPage.default}
                      </span>
                    )}
                    {carrier.verified && (
                      <span className="text-green-600 text-sm" title="Verified">&#10003;</span>
                    )}
                    {carrier.verified === false && carrier.hasApi && carrier.credentials && (
                      <span className="text-red-500 text-sm" title="Not verified">&#10007;</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(carrier)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    carrier.enabled ? "bg-primary" : "bg-surface-container-high"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      carrier.enabled ? "-translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {carrier.hasApi && fields && (
                <div className="mt-4 space-y-3">
                  {fields.map((f) => (
                    <div key={f.field}>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        value={creds[f.field] ?? ""}
                        onChange={(e) => setCredField(carrier.slug, f.field, e.target.value)}
                        placeholder={`${ar.deliveryPage.enter} ${f.label.toLowerCase()}...`}
                        className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        dir="ltr"
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSaveCredentials(carrier)}
                      disabled={isSaving}
                      className="rounded-xl bg-primary text-white px-4 py-2 text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {isSaving ? ar.deliveryPage.saving : ar.deliveryPage.save}
                    </button>
                    <button
                      onClick={() => handleTest(carrier)}
                      disabled={isTesting}
                      className="rounded-xl bg-surface-container-high text-on-surface px-4 py-2 text-xs font-bold shadow-card hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {isTesting ? ar.deliveryPage.testing : ar.deliveryPage.testConnection}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`rounded-xl p-3 text-xs mt-2 ${
                        testResult.success
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      {testResult.success
                        ? ar.deliveryPage.connectionSuccess
                        : `${ar.deliveryPage.connectionFailed} ${testResult.error || ar.deliveryPage.unknownError}`}
                    </div>
                  )}
                </div>
              )}

              {!carrier.hasApi && (
                <p className="text-xs text-on-surface-variant mt-3">
                  {ar.deliveryPage.manualInfo}
                </p>
              )}

              {!carrier.isDefault && carrier.enabled && (
                <button
                  onClick={() => handleSetDefault(carrier)}
                  className="mt-4 text-xs text-primary font-bold hover:underline"
                >
                  {ar.deliveryPage.setDefault}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
