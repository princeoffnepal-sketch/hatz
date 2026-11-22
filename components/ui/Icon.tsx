import type { SVGProps } from "react";

const paths = {
  bag: "M5.5 8h13l-1 12h-11l-1-12Z M9 8V6.5a3 3 0 0 1 6 0V8",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z M15.5 15.5 20 20",
  menu: "M4 7h16 M4 12h16 M4 17h10",
  close: "M6 6l12 12 M18 6 6 18",
  arrow: "M4 12h15 M13 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5 10 17 19 7",
  chevron: "M8 10l4 4 4-4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01",
  needle: "M4 20 18 6 M15 4l5 5 M7 13c-2 1-3 3-3 5",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  cursor: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  return: "M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
