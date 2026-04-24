// Deprecated: nav now lives in <PremiumShell /> (sidebar on desktop +
// bottom tab bar on mobile). This component is kept as a no-op so
// existing pages that still pass `<AppShell nav={<AdminNav />} />`
// continue to compile without changes.
export function AdminNav() {
  return null;
}
