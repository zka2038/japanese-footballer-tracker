"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Search } from "./icons";
import { PlayerAvatar } from "./ui";

export interface SpotlightPlayer {
  id: number;
  slug: string;
  name: string;
  nameJa: string | null;
  teamName: string;
  position: string;
}

const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** ⌘K / Ctrl+K / "/" player search, styled after macOS Spotlight. */
export function Spotlight({ players }: { players: SpotlightPlayer[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const results = useMemo(() => {
    const n = fold(q.trim());
    if (!n) return players.slice(0, 8);
    return players
      .map((p) => {
        const hay = fold(`${p.name} ${p.teamName}`);
        const ja = p.nameJa?.replace(/\s/g, "") ?? "";
        const score = fold(p.name).startsWith(n)
          ? 0
          : fold(p.name)
                .split(" ")
                .some((w) => w.startsWith(n))
            ? 1
            : hay.includes(n) || ja.includes(q.trim())
              ? 2
              : 9;
        return { p, score };
      })
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name))
      .slice(0, 8)
      .map((x) => x.p);
  }, [players, q]);

  useEffect(() => {
    const show = () => {
      setQ("");
      setActive(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        if (document.querySelector('[aria-label="Search players"][role="dialog"]')) setOpen(false);
        else show();
      }
    };
    const onOpen = show;
    window.addEventListener("keydown", onKey);
    window.addEventListener("spotlight:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("spotlight:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (p: SpotlightPlayer | undefined) => {
    if (!p) return;
    setOpen(false);
    router.push(`/players/${p.slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-sm dark:bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search players"
            className="w-full max-w-xl overflow-hidden rounded-[22px] bg-bg-elevated/90 shadow-lift ring-1 ring-hairline-strong backdrop-blur-2xl"
            initial={{ scale: 0.96, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <label className="flex items-center gap-3 px-5">
              <Search size={20} className="shrink-0 text-ink-3" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search players, clubs or 日本語"
                aria-label="Search players"
                aria-controls="spotlight-results"
                aria-activedescendant={results[active] ? `sp-${results[active].id}` : undefined}
                className="h-16 w-full bg-transparent text-[21px] tracking-[-0.01em] outline-none placeholder:text-ink-3 focus-visible:outline-none"
              />
              <kbd className="hidden rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-3 sm:block">esc</kbd>
            </label>
            {results.length > 0 ? (
              <ul
                id="spotlight-results"
                ref={list}
                role="listbox"
                className="max-h-[52vh] overflow-y-auto border-t border-hairline p-2"
              >
                {results.map((p, i) => (
                  <li
                    key={p.id}
                    id={`sp-${p.id}`}
                    data-i={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(p)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${
                      i === active ? "bg-link text-white" : ""
                    }`}
                  >
                    <PlayerAvatar id={p.id} name="" size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">
                        {p.name}
                        {p.nameJa && (
                          <span className={`ml-2 font-jp text-[12px] ${i === active ? "text-white/75" : "text-ink-3"}`}>
                            {p.nameJa}
                          </span>
                        )}
                      </span>
                      <span className={`block truncate text-[12px] ${i === active ? "text-white/80" : "text-ink-3"}`}>
                        {p.position} · {p.teamName}
                      </span>
                    </span>
                    {i === active && <span className="text-[12px] text-white/80">↵</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-hairline px-5 py-8 text-center text-[14px] text-ink-3">No players found.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Nav button that opens Spotlight. */
export function SpotlightButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("spotlight:open"))}
      aria-label="Search players (⌘K)"
      title="Search  ⌘K"
      className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Search size={17} />
    </button>
  );
}
