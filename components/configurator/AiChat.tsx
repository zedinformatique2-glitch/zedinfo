"use client";

import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import type { ConfigComponent, ConfigSelection } from "@/lib/configurator-engine";
import type { Locale } from "@/lib/i18n/config";

type Message = {
  role: "user" | "assistant";
  content: string;
  build?: Record<string, string | string[]> | null;
};

type Props = {
  onApplyBuild: (selection: ConfigSelection) => void;
  allProducts: any[];
  locale: Locale;
  open: boolean;
  onClose: () => void;
};

export function AiChat({ onApplyBuild, allProducts, locale, open, onClose }: Props) {
  const t = useTranslations("aiChat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatAction = useAction(api.aiChat.chat);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await chatAction({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        locale,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.text, build: res.build },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("error") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function applyBuild(build: Record<string, string | string[]>) {
    const sel: ConfigSelection = {};
    const bySlug = new Map(allProducts.map((p: any) => [p.slug, p]));

    function toComp(p: any): ConfigComponent {
      return {
        _id: p._id,
        slug: p.slug,
        nameFr: p.nameFr,
        nameAr: p.nameAr,
        priceDzd: p.priceDzd,
        specs: p.specs,
      };
    }

    for (const [key, val] of Object.entries(build)) {
      if (key === "ram" || key === "storage") {
        const slugs = Array.isArray(val) ? val : [val];
        const comps = slugs.map((s) => bySlug.get(s)).filter(Boolean).map(toComp);
        if (comps.length) (sel as any)[key] = comps;
      } else {
        const p = bySlug.get(val as string);
        if (p) (sel as any)[key] = toComp(p);
      }
    }

    onApplyBuild(sel);
  }

  if (!open) return null;

  return (
        <div className="fixed bottom-24 end-6 z-50 w-[min(400px,calc(100vw-2rem))] h-[min(520px,calc(100vh-10rem))] bg-white rounded-2xl shadow-card ring-1 ring-outline-variant/40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-t-2xl">
            <Icon name="smart_toy" className="text-[22px]" />
            <span className="font-bold text-sm flex-1">{t("title")}</span>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                <Icon name="smart_toy" className="text-[40px] text-primary/30 block mx-auto mb-2" />
                {t("welcome")}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-white rounded-ee-sm"
                        : "bg-slate-100 text-slate-800 rounded-es-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.build && (
                    <button
                      onClick={() => applyBuild(m.build!)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <Icon name="check_circle" className="text-[16px]" />
                      {t("apply")}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-3 rounded-xl rounded-es-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-primary/50 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-primary text-white rounded-xl px-3.5 py-2.5 hover:bg-primary/90 disabled:opacity-40 transition-all"
              >
                <Icon name="send" className="text-[18px]" />
              </button>
            </form>
          </div>
        </div>
  );
}
