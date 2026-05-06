// Bookings list — guest's upcoming visits
const { Icon: BlIcon, LISTINGS } = window.HR;

const MyBookings = ({ onReview, onOpenListing }) => {
  const items = [
    { id: "b1", listing: LISTINGS[0], when: "Oggi · 14:30", duration: 30, status: "active", code: "8K2J", priceTotal: 4.50 },
    { id: "b2", listing: LISTINGS[1], when: "Sab 9 · 11:00", duration: 30, status: "upcoming", code: "9M3X", priceTotal: 6.50 },
    { id: "b3", listing: LISTINGS[3], when: "Ieri · 18:30", duration: 30, status: "review", code: "3F7Q", priceTotal: 8.50 },
    { id: "b4", listing: LISTINGS[2], when: "30 apr · 09:00", duration: 30, status: "past", code: "2A8H", priceTotal: 5.50, rating: 5 },
  ];

  const statusLabel = {
    active: "In corso",
    upcoming: "In arrivo",
    review: "Recensione richiesta",
    past: "Completata",
  };
  const statusColor = {
    active: { bg: "var(--terracotta-soft)", fg: "var(--terracotta-deep)" },
    upcoming: { bg: "oklch(0.94 0.03 240)", fg: "oklch(0.42 0.10 240)" },
    review: { bg: "var(--amber-soft)", fg: "oklch(0.42 0.10 70)" },
    past: { bg: "var(--bg-sunk)", fg: "var(--ink-3)" },
  };

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 28px 60px" }}>
        <div className="section-head">
          <div>
            <div className="section-title">Le tue <em>prenotazioni</em></div>
            <div className="section-sub">{items.length} totali · 1 in corso</div>
          </div>
          <div className="tabs">
            <button className="active">Tutte</button>
            <button>Imminenti</button>
            <button>Storico</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map(b => {
            const sc = statusColor[b.status];
            return (
              <div key={b.id} className="card" style={{ padding: 0, display: "grid", gridTemplateColumns: "180px 1fr auto", alignItems: "stretch" }}>
                <Photo label={b.listing.photos[0]} palette={b.listing.color} style={{ height: "100%" }}/>
                <div style={{ padding: "16px 20px" }}>
                  <div className="spread">
                    <span className="badge-pill" style={{ background: sc.bg, color: sc.fg, borderColor: "transparent" }}>
                      {statusLabel[b.status]}
                    </span>
                    <span className="muted" style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>#{b.code}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, marginTop: 8 }}>
                    {b.listing.name}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {b.listing.area}, {b.listing.neighborhood} · {b.when} · {b.duration} min
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center" }}>
                    <div className="row" style={{ gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
                      <BlIcon.Pin style={{ width: 14, height: 14 }}/>
                      <span>Indirizzo rivelato</span>
                    </div>
                    <div className="row" style={{ gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
                      <BlIcon.Wallet style={{ width: 14, height: 14 }}/>
                      <span>€{b.priceTotal.toFixed(2)} pagati</span>
                    </div>
                    {b.rating && (
                      <div className="row" style={{ gap: 4, fontSize: 13 }}>
                        <Stars value={b.rating} size={12}/>
                        <span style={{ fontWeight: 500 }}>{b.rating}.0 lasciati</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, borderLeft: "1px solid var(--line)" }}>
                  {b.status === "active" && (<>
                    <button className="btn btn-primary btn-sm">Vai all'indirizzo</button>
                    <button className="btn btn-sm">Contatta host</button>
                  </>)}
                  {b.status === "upcoming" && (<>
                    <button className="btn btn-sm" onClick={() => onOpenListing(b.listing)}>Dettagli</button>
                    <button className="btn btn-sm btn-ghost">Annulla</button>
                  </>)}
                  {b.status === "review" && (<>
                    <button className="btn btn-accent btn-sm" onClick={() => onReview(b.listing)}>Lascia recensione</button>
                    <button className="btn btn-sm btn-ghost">Più tardi</button>
                  </>)}
                  {b.status === "past" && (<>
                    <button className="btn btn-sm" onClick={() => onOpenListing(b.listing)}>Riprenota</button>
                    <button className="btn btn-sm btn-ghost">Ricevuta</button>
                  </>)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle pitch */}
        <div style={{ marginTop: 30, padding: "20px 24px", background: "var(--bg-elev)", border: "1px dashed var(--line-strong)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", gap: 16 }}>
          <BlIcon.Bath style={{ width: 28, height: 28, color: "var(--terracotta)", flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Hai un bagno ospiti che usi raramente?</div>
            <div className="muted" style={{ fontSize: 13 }}>Pubblicalo su HomeRest e guadagna in media €280 al mese in città.</div>
          </div>
          <button className="btn">Diventa host</button>
        </div>
      </div>
    </div>
  );
};

window.MyBookings = MyBookings;
