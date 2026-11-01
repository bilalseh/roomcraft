export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" fill="#0f766e" />
      <path
        d="M16 6 26 11.5v9L16 26 6 20.5v-9zM6 11.5 16 17l10-5.5M16 17v9"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
