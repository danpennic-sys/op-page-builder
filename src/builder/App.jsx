/*
 * op-page-builder: mobile form and preview
 * Date: 2026-11-14
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 * Proprietary and confidential. No license is granted.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";
import "./browser-buffer.js";
import { generatePage } from "../lib/generator.js";
import { validateHtml } from "../lib/validator.js";
import starter from "../../examples/vaultmax.json" with { type: "json" };

const STORAGE_KEY = "op-page-builder-draft-vaultmax";

const fields = [
  { key: "businessName", label: "Business name", hint: "Required. Shown as the brand and the page title." },
  { key: "headline", label: "Headline", hint: "Required. The only h1 on the page." },
  { key: "subheadline", label: "Subheadline" },
  { key: "ctaText", label: "Button label", hint: "Blank becomes “Get in touch”." },
  { key: "ctaUrl", label: "Button link", hint: "http, https, or mailto. A javascript: link is rejected." },
  { key: "contactEmail", label: "Contact email", hint: "Used only if the button link is empty." },
];

function localDate() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fileName(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "page"}.html`;
}

function readDraft(raw) {
  const saved = JSON.parse(raw);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
  const next = { ...starter };
  for (const key of Object.keys(starter)) {
    if (typeof saved[key] === "string") next[key] = saved[key];
  }
  return next;
}

function featureCount(features) {
  return features
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export default function App() {
  const [form, setForm] = useState(starter);
  const [pane, setPane] = useState("write");
  const [approvedHtml, setApprovedHtml] = useState(null);
  const [copied, setCopied] = useState("idle");
  const [date, setDate] = useState(null);
  const copyTimer = useRef(null);

  useEffect(() => {
    setDate(localDate());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = readDraft(raw);
        if (draft) setForm(draft);
      }
    } catch {
      /* keep the starter draft */
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, date]);

  const built = useMemo(() => {
    if (!date) return { html: null, report: null, error: null };
    try {
      const html = generatePage(form, { date });
      return { html, report: validateHtml(html), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not generate the page.";
      return { html: null, report: null, error: message };
    }
  }, [form, date]);

  const approved = Boolean(built.html && approvedHtml === built.html && built.report?.ok);
  const kept = Math.min(featureCount(form.features), 6);
  const overflow = featureCount(form.features) > 6;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function download() {
    if (!built.html || !approved) return;
    const blob = new Blob([built.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(form.businessName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function copyHtml() {
    if (!built.html || !approved) return;
    try {
      await navigator.clipboard.writeText(built.html);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied("idle"), 1600);
  }

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <header className="border-b border-line px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-copper uppercase">
              Operator Pages
            </p>
            <h1 className="font-display text-3xl leading-none font-medium text-paper">Page builder</h1>
          </div>
          <p className="max-w-48 text-right text-xs leading-snug text-muted">
            Proof, not a promise.{date ? ` ${date}` : ""}
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-line bg-ink lg:hidden">
        <button
          type="button"
          aria-pressed={pane === "write"}
          onClick={() => setPane("write")}
          className={`min-h-11 text-sm font-semibold ${pane === "write" ? "text-copper" : "text-muted"}`}
        >
          Write
        </button>
        <button
          type="button"
          aria-pressed={pane === "preview"}
          onClick={() => setPane("preview")}
          className={`min-h-11 text-sm font-semibold ${pane === "preview" ? "text-copper" : "text-muted"}`}
        >
          Preview
        </button>
      </div>

      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <section className={`border-line px-4 py-5 lg:border-r lg:px-8 ${pane === "preview" ? "hidden lg:block" : ""}`}>
          <div className="grid gap-4">
            {fields.map((field) => (
              <label key={field.key} className="grid gap-1.5">
                <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                  {field.label}
                </span>
                <input
                  value={form[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                  autoComplete="off"
                  className="min-h-11 rounded-card border border-line bg-ink px-3 text-paper outline-none focus:border-copper"
                />
                {field.hint ? <span className="text-xs leading-snug text-muted">{field.hint}</span> : null}
              </label>
            ))}

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                Features · {kept} of 6
              </span>
              <textarea
                value={form.features}
                onChange={(event) => setField("features", event.target.value)}
                rows={5}
                className="rounded-card border border-line bg-ink px-3 py-2 leading-relaxed text-paper outline-none focus:border-copper"
              />
              <span className="text-xs leading-snug text-muted">
                One feature per line.
                {overflow ? " Only the first six are kept." : ""}
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Accent</span>
              <span className="flex items-center gap-3">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#c8691e"}
                  onChange={(event) => setField("accentColor", event.target.value)}
                  aria-label="Accent color"
                  className="size-11 cursor-pointer border border-line bg-ink"
                />
                <input
                  value={form.accentColor}
                  onChange={(event) => setField("accentColor", event.target.value)}
                  spellCheck={false}
                  className="min-h-11 flex-1 rounded-card border border-line bg-ink px-3 font-mono text-sm text-paper outline-none focus:border-copper"
                />
              </span>
              <span className="text-xs text-muted">A bad color falls back to copper. It is never injected raw.</span>
            </label>
          </div>
        </section>

        <section className={`px-4 py-5 lg:px-8 ${pane === "write" ? "hidden lg:block" : ""}`}>
          <div className="grid gap-2" aria-live="polite">
            {!date ? <p className="text-sm text-muted">Preparing the page…</p> : null}
            {built.error
              ? built.error.split("; ").map((problem) => (
                  <p key={problem} className="text-sm text-copper">
                    {problem}
                  </p>
                ))
              : null}
            {built.report?.errors.map((problem) => (
              <p key={problem} className="text-sm text-copper">
                {problem}
              </p>
            ))}
            {built.report?.warnings.map((problem) => (
              <p key={problem} className="text-sm text-muted">
                {problem}
              </p>
            ))}
            {built.report?.ok ? (
              <p className="flex items-center gap-2 text-sm text-paper">
                <Check className="size-4 text-copper" aria-hidden="true" />
                Guardrail clear · {built.report.bytes} bytes
              </p>
            ) : null}
          </div>

          <div className="mt-4 rounded-card border border-line p-4">
            <div className="mb-3 flex items-center gap-2 text-copper">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <p className="text-xs font-semibold tracking-[0.14em] uppercase">Operator approval</p>
            </div>
            <label className="flex min-h-11 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-copper"
                checked={approved}
                disabled={!built.report?.ok}
                onChange={(event) => setApprovedHtml(event.target.checked ? built.html : null)}
              />
              <span className="text-sm leading-snug">
                I approve this exact page for export. Changing the form clears the approval. Export is not
                publication.
              </span>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={download}
                disabled={!approved}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-copper font-semibold text-ink disabled:opacity-40"
              >
                <Download className="size-4" aria-hidden="true" />
                Download
              </button>
              <button
                type="button"
                onClick={copyHtml}
                disabled={!approved}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-card border border-line font-semibold text-paper disabled:opacity-40"
              >
                <Copy className="size-4" aria-hidden="true" />
                {copied === "copied" ? "Copied" : copied === "failed" ? "Failed" : "Copy HTML"}
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-card border border-line">
            {built.html ? (
              <iframe
                title="Page preview"
                sandbox=""
                srcDoc={built.html}
                className="h-80 w-full bg-ink lg:h-[28rem]"
              />
            ) : (
              <div className="grid h-64 place-items-center px-6 text-center">
                <p className="text-sm leading-relaxed text-muted">
                  Nothing to preview until the required fields are valid.
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            The check is a regex guardrail on this tool’s own output, not a security audit. The preview is the
            page itself, with scripts blocked.
          </p>
        </section>
      </div>
    </main>
  );
}
