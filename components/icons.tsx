import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const ChevronRight = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const ArrowUpRight = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Play = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, { ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />
  </svg>
);

export const Sun = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
  </svg>
);

export const Search = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const Close = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Menu = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

/** Football. */
export const Ball = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, { ...p, strokeWidth: 1.6 })}>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7.5 4 2.9-1.5 4.7h-5L8 10.4z" fill="currentColor" stroke="none" />
    <path d="M12 3v4.5M16 10.4l4.3-1.3M14.5 15.1l2.6 3.7M9.5 15.1l-2.6 3.7M8 10.4 3.7 9.1" />
  </svg>
);

/** Assist: a boot-like swoosh arrow. */
export const Assist = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, { ...p, strokeWidth: 2 })}>
    <path d="M4 17c4.5 0 9-2.5 12-8" />
    <path d="M12.5 8.5 16.5 8l.6 4" />
  </svg>
);

export const Star = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, { ...p, fill: "currentColor", stroke: "none" })}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1-4.5-4.3 6.1-.8z" />
  </svg>
);

export const Plus = ({ size = 14, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Calendar = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);
