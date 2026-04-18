"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LandingPageForm } from "../LandingPageForm";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const page = useQuery(api.landingPages.getById, { id: id as Id<"landingPages"> });

  if (!page) {
    return <div className="p-8 text-on-surface-variant">جارٍ التحميل…</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-black tracking-tighter mb-6 md:mb-8">تعديل صفحة الهبوط</h1>
      <LandingPageForm mode={{ kind: "edit", id: id as Id<"landingPages">, initial: page }} />
    </div>
  );
}
