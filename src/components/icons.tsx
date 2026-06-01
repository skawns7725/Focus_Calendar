import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ children, size = 18, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

const strokeProps = {
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function BrandIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="8.25" {...strokeProps} /><path d="m8.6 12 2.15 2.2 4.85-5" {...strokeProps} /></IconBase>;
}

export function ListIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 7h9M9 12h9M9 17h9M5.5 7h.01M5.5 12h.01M5.5 17h.01" {...strokeProps} /></IconBase>;
}

export function DayIcon(props: IconProps) {
  return <IconBase {...props}><path d="M7 3.5v3M17 3.5v3M4.5 9h15M6.5 5h11a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" {...strokeProps} /><path d="M8 12h3v3H8z" {...strokeProps} /></IconBase>;
}

export function WeekIcon(props: IconProps) {
  return <IconBase {...props}><path d="M7 3.5v3M17 3.5v3M4.5 9h15M6.5 5h11a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" {...strokeProps} /><path d="M8 12h2M12 12h2M16 12h.01M8 15.5h2M12 15.5h2M16 15.5h.01" {...strokeProps} /></IconBase>;
}

export function SettingsIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="2.75" {...strokeProps} /><path d="M19 12a7 7 0 0 0-.08-1l1.58-1.22-1.8-3.12-1.87.76a7.35 7.35 0 0 0-1.73-1L14.82 4h-3.64l-.28 2.42a7.35 7.35 0 0 0-1.73 1L7.3 6.66 5.5 9.78 7.08 11a7.13 7.13 0 0 0 0 2L5.5 14.22l1.8 3.12 1.87-.76a7.35 7.35 0 0 0 1.73 1l.28 2.42h3.64l.28-2.42a7.35 7.35 0 0 0 1.73-1l1.87.76 1.8-3.12L18.92 13c.05-.33.08-.66.08-1Z" {...strokeProps} /></IconBase>;
}

export function PlusIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14M5 12h14" {...strokeProps} /></IconBase>;
}

export function CheckIcon(props: IconProps) {
  return <IconBase {...props}><path d="m6 12.5 3.5 3.5L18 7.5" {...strokeProps} /></IconBase>;
}

export function ChevronRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 6 6 6-6 6" {...strokeProps} /></IconBase>;
}

export function BellIcon(props: IconProps) {
  return <IconBase {...props}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" {...strokeProps} /></IconBase>;
}

export function CloseIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 6l12 12M18 6 6 18" {...strokeProps} /></IconBase>;
}
