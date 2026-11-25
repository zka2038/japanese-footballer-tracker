"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { createContext, use, useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { youtubeEmbed } from "@/lib/images";
import { Close, Play } from "./icons";

interface OpenVideo {
  videoId: string;
  title: string;
  subtitle?: string;
}

const noopSubscribe = () => () => {};

const VideoContext = createContext<(v: OpenVideo) => void>(() => {});

/** Hosts a single lightbox for every video trigger on the page. */
export function VideoProvider({ children }: { children: ReactNode }) {
  const [video, setVideo] = useState<OpenVideo | null>(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const close = useCallback(() => setVideo(null), []);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [video, close]);

  return (
    <VideoContext value={setVideo}>
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {video && (
              <motion.div
                key="overlay"
                className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-xl sm:p-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
                role="dialog"
                aria-modal="true"
                aria-label={video.title}
              >
                <motion.div
                  className="w-full max-w-5xl"
                  initial={{ scale: 0.94, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-3 flex items-start justify-between gap-4 text-white">
                    <div>
                      <p className="text-[19px] font-semibold tracking-[-0.01em]">{video.title}</p>
                      {video.subtitle && <p className="text-[14px] text-white/60">{video.subtitle}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                      aria-label="Close video"
                      autoFocus
                    >
                      <Close />
                    </button>
                  </div>
                  <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
                    <iframe
                      src={youtubeEmbed(video.videoId)}
                      title={video.title}
                      className="size-full"
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </VideoContext>
  );
}

export function useVideo() {
  return use(VideoContext);
}

/** Thumbnail card that opens the lightbox. */
export function VideoThumb({
  videoId,
  thumbnail,
  title,
  subtitle,
  className = "",
  children,
}: {
  videoId: string;
  thumbnail: string;
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  const open = useVideo();
  return (
    <button
      type="button"
      onClick={() => open({ videoId, title, subtitle })}
      className={`group relative block w-full overflow-hidden rounded-[20px] bg-surface-3 text-left ${className}`}
      aria-label={`Play highlights: ${title}`}
    >
      <Image
        src={thumbnail}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        className="object-cover transition-transform duration-700 ease-(--ease-apple) group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-white/22 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
        <Play size={18} className="translate-x-px" />
      </span>
      {children && <span className="absolute inset-x-0 bottom-0 p-4 text-white">{children}</span>}
    </button>
  );
}

/** Small inline play button for tables and lists. */
export function PlayButton({ videoId, title, subtitle }: { videoId: string; title: string; subtitle?: string }) {
  const open = useVideo();
  return (
    <button
      type="button"
      onClick={() => open({ videoId, title, subtitle })}
      className="grid size-7 place-items-center rounded-full bg-surface-2 text-ink-2 transition hover:bg-accent hover:text-white"
      aria-label={`Watch highlights: ${title}`}
      title="Watch highlights"
    >
      <Play size={11} className="translate-x-[0.5px]" />
    </button>
  );
}
