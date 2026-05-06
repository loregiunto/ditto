// Badge component
const { Icon } = window.HR;

const BADGES = {
  private: { icon: "Home", label: "Privato", cls: "badge-private" },
  business: { icon: "Storefront", label: "Attività", cls: "badge-business" },
  verified: { icon: "Check", label: "Verificato", cls: "badge-verified" },
  super: { icon: "Crown", label: "Super Host", cls: "badge-super" },
};

const Badge = ({ kind, mode = "full" }) => {
  const b = BADGES[kind];
  if (!b) return null;
  const I = Icon[b.icon];
  return (
    <span className={`badge-pill ${b.cls}`}>
      <I/>
      {mode === "full" && <span>{b.label}</span>}
    </span>
  );
};

const Stars = ({ value, size = 12 }) => {
  const full = Math.round(value);
  return (
    <span className="stars" style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Icon.Star key={i} style={{ width: size, height: size, color: i <= full ? "var(--ink)" : "var(--ink-4)" }}/>
      ))}
    </span>
  );
};

window.Badge = Badge;
window.BADGES = BADGES;
window.Stars = Stars;
