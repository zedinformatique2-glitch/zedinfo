"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { searchHardware } from "@/lib/fps-engine";

type Item = { id: string; name: string; score: number; popular?: boolean };

/**
 * Searchable picker over the built-in hardware list. A value only counts once
 * a model is picked from the list.
 */
export function HardwareInput<T extends Item>({
  items,
  icon,
  label,
  placeholder,
  selected,
  onSelect,
  invalid,
  noMatch,
  popularLabel,
}: {
  items: T[];
  icon: string;
  label: string;
  placeholder: string;
  selected: T | null;
  onSelect: (item: T | null) => void;
  invalid?: boolean;
  noMatch: string;
  popularLabel: string;
}) {
  const [text, setText] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Keep the text in sync when the selection changes from outside (presets).
  useEffect(() => {
    setText(selected?.name ?? "");
  }, [selected]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setText(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selected]);

  const query = selected && text === selected.name ? "" : text;
  const list = useMemo(() => searchHardware(items, query, 8), [items, query]);

  function pick(item: T) {
    onSelect(item);
    setText(item.name);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (list[active]) pick(list[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setText(selected?.name ?? "");
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5 ring-1 transition-all focus-within:ring-2 focus-within:ring-primary-container focus-within:bg-white/[0.09] ${
          invalid && !selected ? "ring-red-500/70" : selected ? "ring-emerald-400/40" : "ring-white/15"
        }`}
      >
        <Icon name={icon} className={`text-[20px] shrink-0 ${selected ? "text-primary-fixed-dim" : "text-slate-500"}`} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.target.select();
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent py-3 text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
        />
        {selected ? (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setText("");
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        ) : (
          <Icon name="expand_more" className="text-[20px] text-slate-500 shrink-0" />
        )}
      </div>

      {open && (
        <div id={listId} role="listbox" className="absolute z-30 mt-1.5 w-full rounded-xl bg-slate-900 ring-1 ring-white/15 shadow-2xl overflow-hidden">
          {query === "" && (
            <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {popularLabel}
            </div>
          )}
          {list.length === 0 ? (
            <div className="px-3.5 py-3 text-sm text-slate-400">{noMatch}</div>
          ) : (
            <div className="max-h-72 overflow-auto">
              {list.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === item.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(item)}
                  className={`w-full text-start px-3.5 py-2.5 text-sm text-white flex items-center justify-between gap-3 transition-colors ${
                    i === active ? "bg-primary/40" : ""
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {selected?.id === item.id && <Icon name="check" className="text-[16px] text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
