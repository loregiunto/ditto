// Stylized illustrated map for HomeRest
// A hand-drawn city map with rivers, blocks, parks
const HRMap = ({ listings, activeId, onPin, hover, setHover, userPin = { x: 50, y: 50 } }) => {
  return (
    <div className="map-stage">
      <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="parkHatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="oklch(0.74 0.06 145)" strokeWidth="0.4"/>
          </pattern>
          <pattern id="bldgHatch" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="1.2" stroke="oklch(0.86 0.02 60)" strokeWidth="0.3"/>
          </pattern>
        </defs>

        {/* base */}
        <rect width="100" height="100" fill="#EDE5D2"/>

        {/* river — winding */}
        <path d="M-2 60 C 12 56, 18 70, 32 65 S 56 58, 70 70 S 92 64, 105 72 L 105 80 L -2 80 Z"
              fill="#C7D9D6" opacity="0.85"/>
        <path d="M-2 60 C 12 56, 18 70, 32 65 S 56 58, 70 70 S 92 64, 105 72"
              stroke="oklch(0.66 0.04 200)" strokeWidth="0.25" fill="none" opacity="0.6"/>

        {/* park blocks */}
        <rect x="6" y="8" width="22" height="14" rx="1" fill="url(#parkHatch)" opacity="0.7"/>
        <rect x="6" y="8" width="22" height="14" rx="1" fill="oklch(0.84 0.05 145)" opacity="0.35"/>
        <rect x="68" y="6" width="20" height="12" rx="1" fill="url(#parkHatch)" opacity="0.7"/>
        <rect x="68" y="6" width="20" height="12" rx="1" fill="oklch(0.84 0.05 145)" opacity="0.35"/>
        <circle cx="14" cy="14" r="0.6" fill="oklch(0.55 0.1 145)"/>
        <circle cx="20" cy="17" r="0.5" fill="oklch(0.55 0.1 145)"/>
        <circle cx="74" cy="11" r="0.6" fill="oklch(0.55 0.1 145)"/>
        <circle cx="82" cy="13" r="0.5" fill="oklch(0.55 0.1 145)"/>

        {/* piazza (circle) */}
        <circle cx="48" cy="38" r="4" fill="oklch(0.92 0.02 70)" stroke="#D4CBBC" strokeWidth="0.2"/>
        <circle cx="48" cy="38" r="0.8" fill="oklch(0.62 0.13 45)" opacity="0.5"/>

        {/* building blocks */}
        {[
          [3, 26, 14, 8], [20, 26, 10, 6], [33, 26, 10, 6],
          [3, 36, 12, 6], [18, 33, 8, 6], [29, 36, 8, 4],
          [55, 22, 9, 8], [66, 22, 14, 6], [82, 22, 14, 6],
          [55, 36, 9, 5], [70, 32, 12, 6], [86, 33, 12, 6],
          [3, 46, 8, 6], [14, 46, 12, 8], [30, 46, 10, 6],
          [42, 44, 8, 6], [54, 46, 12, 6],
          [4, 84, 10, 8], [18, 84, 14, 8], [38, 84, 10, 8],
          [54, 84, 12, 8], [72, 84, 16, 8], [92, 84, 8, 8],
          [78, 50, 10, 6], [90, 50, 8, 6],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="#F1ECE0" stroke="#D8CFBE" strokeWidth="0.2" rx="0.3"/>
            <rect x={x} y={y} width={w} height={h} fill="url(#bldgHatch)" opacity="0.4" rx="0.3"/>
          </g>
        ))}

        {/* roads — light cream lines */}
        <g stroke="#FAF7F2" strokeWidth="1.2" fill="none" opacity="0.95">
          <path d="M0 30 H100"/>
          <path d="M0 44 H100"/>
          <path d="M0 52 H100"/>
          <path d="M0 82 H100"/>
          <path d="M30 0 V52"/>
          <path d="M52 0 V82"/>
          <path d="M64 0 V82"/>
          <path d="M88 0 V82"/>
        </g>
        {/* dashed road */}
        <g stroke="#FAF7F2" strokeWidth="0.6" fill="none" strokeDasharray="1.5 1.5" opacity="0.9">
          <path d="M16 0 V52"/>
          <path d="M0 38 H46"/>
          <path d="M40 0 V52"/>
        </g>

        {/* compass */}
        <g transform="translate(92, 92)" opacity="0.55">
          <circle r="3" fill="none" stroke="#A89E8C" strokeWidth="0.2"/>
          <path d="M0 -2.5 L0.6 0 L0 2.5 L-0.6 0 Z" fill="#1A1814"/>
          <text y="-3.4" fontSize="2" textAnchor="middle" fill="#1A1814" fontFamily="Geist, sans-serif" fontWeight="600">N</text>
        </g>

        {/* scale bar */}
        <g transform="translate(6, 94)" fontFamily="Geist Mono, monospace">
          <line x1="0" y1="0" x2="8" y2="0" stroke="#1A1814" strokeWidth="0.3"/>
          <line x1="0" y1="-0.6" x2="0" y2="0.6" stroke="#1A1814" strokeWidth="0.3"/>
          <line x1="8" y1="-0.6" x2="8" y2="0.6" stroke="#1A1814" strokeWidth="0.3"/>
          <text x="9.5" y="0.6" fontSize="1.6" fill="#1A1814">300m</text>
        </g>
      </svg>

      {/* User location */}
      <div className="user-pin" style={{ left: `${userPin.x}%`, top: `${userPin.y}%` }}>
        <div className="ring"/>
        <div className="core"/>
      </div>

      {/* Pins */}
      {listings.map(l => {
        const cls = ["pin-bubble"];
        if (l.state === "available") {}
        else if (l.state === "urgent") cls.push("urgent");
        else if (l.state === "full") cls.push("full");
        if (l.id === activeId) cls.push("active");
        if (l.id === hover) cls.push("active");
        return (
          <div key={l.id} className={`map-pin ${l.id === activeId ? "active" : ""}`}
               style={{ left: `${l.coords.x}%`, top: `${l.coords.y}%` }}
               onMouseEnter={() => setHover && setHover(l.id)}
               onMouseLeave={() => setHover && setHover(null)}
               onClick={() => onPin && onPin(l)}>
            <div className={cls.join(" ")}>
              <span className="pin-dot"/>
              €{l.price}
            </div>
          </div>
        );
      })}
    </div>
  );
};

window.HRMap = HRMap;
