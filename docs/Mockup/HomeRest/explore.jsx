// Explore — map + listing list + filters
const { Icon: ExIcon, LISTINGS } = window.HR;

const ListingCard = ({ l, hover, setHover, onClick, liked, toggleLike, selected }) => {
  const stateLabel = {
    available: "Disponibile ora",
    urgent: "Ultimi posti",
    full: "Al completo",
  }[l.state];
  return (
    <div className={`listing-card ${selected ? "selected" : ""}`}
         onMouseEnter={() => setHover && setHover(l.id)}
         onMouseLeave={() => setHover && setHover(null)}
         onClick={onClick}>
      <div className="listing-photo" style={{ position: "relative" }}>
        <Photo label={l.photos[0]} palette={l.color} style={{ position: "absolute", inset: 0 }}/>
        <div className={`availability ${l.state === "urgent" ? "urgent" : l.state === "full" ? "full" : ""}`}>
          <span className="pip"/>
          {stateLabel}
        </div>
        <div className={`heart ${liked ? "liked" : ""}`} onClick={(e) => { e.stopPropagation(); toggleLike(l.id); }}>
          <ExIcon.Heart style={{ width: 16, height: 16, fill: liked ? "currentColor" : "none" }}/>
        </div>
        <div className="price-tag">€{l.price}<span style={{ color: "var(--ink-3)", fontWeight: 400 }}>/h</span></div>
      </div>
      <div className="listing-body">
        <div className="listing-head">
          <div>
            <div className="listing-name">{l.name}</div>
            <div className="listing-meta">{l.neighborhood} · {l.city} · {l.distance}</div>
          </div>
          <div className="rating">
            <ExIcon.Star/>
            {l.rating}
            <span className="muted" style={{ fontWeight: 400 }}>({l.reviews})</span>
          </div>
        </div>
        <div className="listing-tags">
          {l.badges.slice(0, 2).map(b => <Badge key={b} kind={b}/>)}
        </div>
      </div>
    </div>
  );
};

const FilterChip = ({ active, children, onClick, icon }) => (
  <button className="btn btn-sm" onClick={onClick}
          style={{
            background: active ? "var(--ink)" : "var(--bg-elev)",
            color: active ? "var(--bg)" : "var(--ink)",
            borderColor: active ? "var(--ink)" : "var(--line)",
          }}>
    {icon}
    {children}
  </button>
);

const Explore = ({ onOpenListing, liked, toggleLike, demoState }) => {
  const [filters, setFilters] = React.useState({ city: "Tutte", hostType: "all", quick: "" });
  const [hover, setHover] = React.useState(null);
  const [active, setActive] = React.useState(null);

  // Apply demo state override (Tweaks)
  let listings = LISTINGS.map(l => {
    if (demoState === "all-available") return { ...l, state: "available" };
    if (demoState === "all-urgent") return { ...l, state: l.id === "l5" ? "full" : "urgent" };
    if (demoState === "all-full") return { ...l, state: "full" };
    return l;
  });

  if (filters.city !== "Tutte") listings = listings.filter(l => l.city === filters.city);
  if (filters.hostType !== "all") listings = listings.filter(l => l.hostType === filters.hostType);
  if (filters.quick === "verified") listings = listings.filter(l => l.badges.includes("verified"));
  if (filters.quick === "super") listings = listings.filter(l => l.badges.includes("super"));
  if (filters.quick === "available") listings = listings.filter(l => l.state !== "full");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(520px, 44%) 1fr", flex: 1, minHeight: 0 }}>
      {/* Left: list */}
      <div style={{ overflowY: "auto", padding: "20px 28px 32px", borderRight: "1px solid var(--line)" }}>
        <div className="section-head">
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{ whiteSpace: "nowrap" }}>Bagni <em>oggi</em></div>
            <div className="section-sub">{listings.length} disponibili nel raggio di 2 km</div>
          </div>
          <button className="btn btn-sm">
            <ExIcon.Sliders/>
            Ordina
          </button>
        </div>

        {/* City picker */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {["Tutte", "Milano", "Roma", "Firenze"].map(c => (
            <FilterChip key={c} active={filters.city === c} onClick={() => setFilters({...filters, city: c})}>
              {c}
            </FilterChip>
          ))}
        </div>

        {/* Quick filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <FilterChip active={filters.quick === "available"} onClick={() => setFilters({...filters, quick: filters.quick === "available" ? "" : "available"})}
                       icon={<ExIcon.Bolt style={{ width: 13, height: 13 }}/>}>Disponibili ora</FilterChip>
          <FilterChip active={filters.quick === "verified"} onClick={() => setFilters({...filters, quick: filters.quick === "verified" ? "" : "verified"})}
                       icon={<ExIcon.Shield style={{ width: 13, height: 13 }}/>}>Solo verificati</FilterChip>
          <FilterChip active={filters.quick === "super"} onClick={() => setFilters({...filters, quick: filters.quick === "super" ? "" : "super"})}
                       icon={<ExIcon.Crown style={{ width: 13, height: 13 }}/>}>Super Host</FilterChip>
          <FilterChip active={filters.hostType === "private"} onClick={() => setFilters({...filters, hostType: filters.hostType === "private" ? "all" : "private"})}
                       icon={<ExIcon.Home style={{ width: 13, height: 13 }}/>}>Privati</FilterChip>
          <FilterChip active={filters.hostType === "business"} onClick={() => setFilters({...filters, hostType: filters.hostType === "business" ? "all" : "business"})}
                       icon={<ExIcon.Storefront style={{ width: 13, height: 13 }}/>}>Attività</FilterChip>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {listings.map(l => (
            <ListingCard key={l.id} l={l}
                          hover={hover} setHover={setHover}
                          selected={hover === l.id}
                          liked={liked.includes(l.id)}
                          toggleLike={toggleLike}
                          onClick={() => onOpenListing(l)}/>
          ))}
        </div>

        {listings.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)" }}>
            Nessun bagno corrisponde ai filtri.
          </div>
        )}
      </div>

      {/* Right: map */}
      <div style={{ position: "relative", minHeight: 0 }}>
        <HRMap listings={listings}
               activeId={active}
               hover={hover} setHover={setHover}
               onPin={(l) => onOpenListing(l)}/>

        {/* Floating control */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="icon-btn" style={{ background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)" }}>
            <ExIcon.Plus style={{ width: 16, height: 16 }}/>
          </button>
          <button className="icon-btn" style={{ background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: -3 }}>−</span>
          </button>
          <button className="icon-btn" style={{ background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)", marginTop: 8 }} title="La mia posizione">
            <ExIcon.Pin style={{ width: 16, height: 16 }}/>
          </button>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 16, left: 16,
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-md)",
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "var(--shadow-sm)",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--ink-2)" }}>Disponibilità</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--sage)" }}/>
              <span>Disponibile</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--terracotta)" }}/>
              <span>Ultimi posti</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--ink-4)" }}/>
              <span>Al completo</span>
            </div>
          </div>
        </div>

        {/* Hint card */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-md)",
          padding: "8px 14px",
          fontSize: 12,
          color: "var(--ink-2)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          backdropFilter: "blur(4px)",
        }}>
          <ExIcon.Pin style={{ width: 14, height: 14, color: "var(--terracotta)" }}/>
          <span>Sei in <strong>Brera, Milano</strong></span>
        </div>
      </div>
    </div>
  );
};

window.Explore = Explore;
