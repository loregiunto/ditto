// Photo placeholder component — striped warm placeholder with label
const Photo = ({ label, palette = "warmCream", style = {}, className = "" }) => {
  const palettes = {
    warmCream: { bg: "#EDE5D2", stripe: "rgba(26, 24, 20, 0.05)" },
    terracotta: { bg: "oklch(0.86 0.06 45)", stripe: "oklch(0.62 0.13 45 / 0.18)" },
    sage: { bg: "oklch(0.88 0.04 145)", stripe: "oklch(0.62 0.07 145 / 0.20)" },
    stone: { bg: "#E5DED2", stripe: "rgba(26, 24, 20, 0.06)" },
    rose: { bg: "oklch(0.90 0.04 25)", stripe: "oklch(0.65 0.14 25 / 0.16)" },
  };
  const p = palettes[palette] || palettes.warmCream;
  return (
    <div className={`photo ${className}`} style={{
      background: `repeating-linear-gradient(135deg, transparent 0 14px, ${p.stripe} 14px 15px), ${p.bg}`,
      ...style,
    }}>
      {label && <span className="photo-label">{label}</span>}
    </div>
  );
};

window.Photo = Photo;
