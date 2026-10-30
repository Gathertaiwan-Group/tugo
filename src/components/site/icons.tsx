export function Logo({ light = false }: { light?: boolean }) {
  const stroke = light ? "#F4EFE5" : "#244A3A";
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
      <rect x="1.5" y="1.5" width="27" height="27" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M21 15a6 6 0 1 1-6-6" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="9" r="2.2" fill="#F07C46" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = "#242622" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      <circle cx="8.5" cy="8.5" r="6" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="13" y1="13" x2="18" y2="18" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="7" r="3.6" fill="none" stroke="#242622" strokeWidth="1.6" />
      <path d="M3 18c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" fill="none" stroke="#242622" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="6.5" width="14" height="11" rx="1.5" fill="none" stroke="#F4EFE5" strokeWidth="1.6" />
      <path d="M7 6.5V5a3 3 0 0 1 6 0v1.5" fill="none" stroke="#F4EFE5" strokeWidth="1.6" />
    </svg>
  );
}
