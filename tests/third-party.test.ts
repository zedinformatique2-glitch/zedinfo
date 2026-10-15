import { describe, expect, it, vi } from "vitest";
import { googleAnalyticsJs, googleTagManagerJs, metaPixelJs } from "../lib/third-party";

/** Runs a tracker snippet against a fake window/document and reports what happened. */
function run(js: string, readyState: "loading" | "complete" = "loading") {
  const injected: string[] = [];
  const listeners: Record<string, (() => void)[]> = {};
  const idleCallbacks: (() => void)[] = [];
  const win: any = {
    addEventListener: (ev: string, fn: () => void) => (listeners[ev] ??= []).push(fn),
    requestIdleCallback: (fn: () => void) => idleCallbacks.push(fn),
  };
  const doc: any = {
    readyState,
    createElement: () => ({}),
    head: { appendChild: (s: { src: string }) => injected.push(s.src) },
  };
  win.window = win;
  win.document = doc;
  const fn = new Function("window", "document", "requestIdleCallback", `with(window){${js}}`);
  fn(win, doc, win.requestIdleCallback);
  const finishLoading = () => {
    listeners.load?.forEach((fn) => fn());
    idleCallbacks.splice(0).forEach((cb) => cb());
  };
  return { win, injected, finishLoading };
}

describe("tracker snippets", () => {
  it("queue the pixel's init and PageView at once but download fbevents.js only after load", () => {
    const { win, injected, finishLoading } = run(metaPixelJs("929394893194723"));
    expect(injected).toEqual([]);
    expect(win.fbq.queue.map((a: IArguments) => [...a])).toEqual([
      ["init", "929394893194723"],
      ["track", "PageView"],
    ]);
    win.fbq("track", "ViewContent", { value: 1 });
    expect(win.fbq.queue).toHaveLength(3);
    finishLoading();
    expect(injected).toEqual(["https://connect.facebook.net/en_US/fbevents.js"]);
  });

  it("does not set the pixel up twice", () => {
    const { win } = run(metaPixelJs("1"));
    const first = win.fbq;
    new Function("window", "document", `with(window){${metaPixelJs("1")}}`)(win, win.document);
    expect(win.fbq).toBe(first);
  });

  it("downloads straight after idle when the page has already loaded", () => {
    const { injected, finishLoading } = run(googleTagManagerJs("GTM-P8R9ZP5B"), "complete");
    expect(injected).toEqual([]);
    finishLoading();
    expect(injected).toEqual(["https://www.googletagmanager.com/gtm.js?id=GTM-P8R9ZP5B"]);
  });

  it("queue GA config and the GTM start event in dataLayer before any download", () => {
    const { win, injected, finishLoading } = run(
      googleAnalyticsJs("G-QZ21CMPYMX") + googleTagManagerJs("GTM-P8R9ZP5B"),
    );
    expect(injected).toEqual([]);
    const flat = win.dataLayer.map((e: any) => (e.length !== undefined ? [...e] : e));
    expect(flat[1]).toEqual(["config", "G-QZ21CMPYMX"]);
    expect(flat[2]).toMatchObject({ event: "gtm.js" });
    finishLoading();
    expect(injected).toEqual([
      "https://www.googletagmanager.com/gtag/js?id=G-QZ21CMPYMX",
      "https://www.googletagmanager.com/gtm.js?id=GTM-P8R9ZP5B",
    ]);
  });

  it("falls back to a timer when requestIdleCallback is missing", () => {
    vi.useFakeTimers();
    const injected: string[] = [];
    const win: any = { addEventListener: () => {} };
    const doc: any = {
      readyState: "complete",
      createElement: () => ({}),
      head: { appendChild: (s: { src: string }) => injected.push(s.src) },
    };
    win.window = win;
    new Function("window", "document", "setTimeout", `with(window){${googleTagManagerJs("X")}}`)(
      win,
      doc,
      setTimeout,
    );
    expect(injected).toEqual([]);
    vi.advanceTimersByTime(1500);
    expect(injected).toHaveLength(1);
    vi.useRealTimers();
  });
});
