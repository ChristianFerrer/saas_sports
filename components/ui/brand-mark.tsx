type Props = {
  size?: number;
  className?: string;
};

// Minimalist mark: a crosshair/pin evoking "spots". Inline SVG so it
// inherits currentColor; keep it flat per the UX brief.
export function BrandMark({ size = 28, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="white" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2.4" fill="white" />
    </svg>
  );
}
