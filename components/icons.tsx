const paths: Record<string, string> = {
  home: "M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6",
  people: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c0-4 3-6 7-6s7 2 7 6 M17 3a4 4 0 0 1 0 8 M22 21c0-3-2-5-5-5.5",
  wand: "M14 4l6 6-9 9H5v-6z M13 5l6 6 M3 21h6",
  bars: "M4 20V11 M10 20V5 M16 20v-7 M21 20H3",
  briefcase: "M3 8h18v11H3z M8 8V5h8v3 M3 13h18",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5",
  chevron: "M6 9l6 6 6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z M8.5 12l2.5 2.5 4.5-5",
  check: "M5 12l5 5 9-10",
  bed: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6 M3 18h18 M6 10V7h12v3",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M6 12V6a2 2 0 0 1 4 0",
  area: "M4 4h16v16H4z M4 9h16 M9 4v16",
  compare: "M9 6l-5 6 5 6 M15 6l5 6-5 6",
  doc: "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6",
  chat: "M4 5h16v11H8l-4 4z M8 10h8",
  sparkle: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5L18 18 M18 6l-2.5 2.5 M8.5 15.5L6 18",
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className, stroke = 1.8 }: { name: IconName; size?: number; className?: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
