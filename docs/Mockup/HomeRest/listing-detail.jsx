// Listing detail screen + booking flow
const { Icon: LDIcon, REVIEWS } = window.HR;

const ListingDetail = ({ listing: l, onBack, onBook, liked, toggleLike }) => {
  const reviews = REVIEWS.filter(r => r.listing === l.id).concat(
    [{ id: "rx", listing: l.id, author: "Chiara M.", date: "3 settimane fa", rating: 5,
       body: "Bagno spettacolare, host gentilissimo. Ho consigliato HomeRest a tutti i miei colleghi." }]
  );

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 28px 60px" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>
          <LDIcon.Back style={{ width: 14, height: 14 }}/>
          Torna alla mappa
        </button>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>
              {l.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 14, color: "var(--ink-2)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Stars value={l.rating} size={13}/>
                <strong style={{ color: "var(--ink)" }}>{l.rating}</strong>
                <span className="muted">· {l.reviews} recensioni</span>
              </span>
              <span className="muted">·</span>
              <span>{l.neighborhood}, {l.city}</span>
              <span className="muted">·</span>
              <span>{l.distance} da te</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={() => toggleLike(l.id)}>
              <LDIcon.Heart style={{ width: 14, height: 14, fill: liked.includes(l.id) ? "var(--terracotta)" : "none", color: liked.includes(l.id) ? "var(--terracotta)" : "currentColor" }}/>
              Salva
            </button>
            <button className="btn btn-sm">Condividi</button>
          </div>
        </div>

        {/* Photo grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "210px 210px",
          gap: 6,
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: 28,
        }}>
          <Photo label={l.photos[0]} palette={l.color} style={{ gridRow: "span 2" }}/>
          <Photo label={l.photos[1] || "Dettaglio"} palette={l.color}/>
          <Photo label={l.photos[2] || "Ambiente"} palette="warmCream"/>
          <Photo label={l.photos[3] || "Esterno"} palette="stone"/>
          <div style={{ position: "relative" }}>
            <Photo label="Galleria" palette="rose" style={{ position: "absolute", inset: 0 }}/>
            <button className="btn btn-sm" style={{ position: "absolute", bottom: 10, right: 10 }}>
              <LDIcon.Camera style={{ width: 13, height: 13 }}/>
              Tutte le foto (8)
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "start" }}>
          {/* Left column */}
          <div>
            {/* Host strip */}
            <div className="row" style={{ paddingBottom: 22, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                {l.host.split(" ").map(s => s[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 16 }}>Ospitato da {l.host}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Host dal 2024 · risponde in 8 minuti</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {l.badges.map(b => <Badge key={b} kind={b}/>)}
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 0 }}>{l.blurb}</p>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
              Si trova al primo piano, con citofono dedicato. {l.host.split(" ")[0]} ti aspetta all'orario prenotato e ti accompagna senza fretta. Asciugamani puliti per ogni ospite, prodotti di cortesia inclusi.
            </p>

            {/* Features */}
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, margin: "0 0 14px" }}>Cosa offre</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {l.features.map((f, i) => {
                  const I = LDIcon[f.icon];
                  return (
                    <div key={i} className="row" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--bg-elev)" }}>
                      <I style={{ width: 18, height: 18, color: "var(--ink-2)" }}/>
                      <span style={{ fontSize: 14 }}>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust block */}
            <div style={{ marginTop: 28, padding: 18, background: "var(--sage-soft)", borderRadius: "var(--r-lg)", border: "1px solid oklch(0.85 0.04 145)" }}>
              <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--bg-elev)", display: "grid", placeItems: "center", color: "oklch(0.42 0.08 145)" }}>
                  <LDIcon.Shield style={{ width: 20, height: 20 }}/>
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: "oklch(0.32 0.06 145)" }}>Pulito, garantito.</div>
                  <div style={{ fontSize: 14, color: "oklch(0.42 0.06 145)", marginTop: 4 }}>
                    Ogni host firma il nostro standard di pulizia. Se non trovi il bagno come nella foto, ti rimborsiamo entro 24 ore.
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div style={{ marginTop: 36 }}>
              <div className="section-head">
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <LDIcon.Star style={{ width: 18, height: 18 }}/>
                    {l.rating} · {l.reviews} recensioni
                  </h3>
                </div>
                <button className="btn btn-sm">Vedi tutte</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {reviews.slice(0, 4).map(r => (
                  <div key={r.id} className="card" style={{ padding: 18 }}>
                    <div className="row" style={{ marginBottom: 8 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {r.author.split(" ").map(s => s[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{r.author}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{r.date}</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <Stars value={r.rating} size={11}/>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>"{r.body}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, margin: "0 0 14px" }}>Dove si trova</h3>
              <div style={{ position: "relative", height: 220, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)" }}>
                <HRMap listings={[l]} activeId={l.id}/>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <LDIcon.Shield style={{ width: 14, height: 14 }}/>
                L'indirizzo esatto ti viene rivelato dopo la conferma — vedi solo il quartiere.
              </div>
            </div>
          </div>

          {/* Right: booking card */}
          <div style={{ position: "sticky", top: 84 }}>
            <div className="card" style={{ padding: 22, boxShadow: "var(--shadow-md)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}>€{l.price}</span>
                <span className="muted">/ ora</span>
                {l.state === "urgent" && (
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--terracotta-deep)", fontWeight: 600 }}>
                    Ultimi 2 slot
                  </span>
                )}
              </div>

              <div style={{ marginTop: 14, border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Data</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>Oggi · 6 maggio</div>
                </div>
                <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1px 1fr", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Arrivo</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>14:30</div>
                  </div>
                  <div style={{ background: "var(--line)", height: "60%" }}/>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Durata</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>30 min</div>
                  </div>
                </div>
              </div>

              <button
                className={`btn ${l.state === "full" ? "" : "btn-accent"} btn-lg`}
                style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                disabled={l.state === "full"}
                onClick={() => l.state !== "full" && onBook(l)}>
                {l.state === "full" ? "Al completo oggi" : "Prenota ora"}
              </button>

              <div className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>
                Non verrai addebitato finché non confermi
              </div>

              <div className="divider"/>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                <div className="spread"><span className="muted">€{l.price} × 1 ora</span><span>€{l.price.toFixed(2)}</span></div>
                <div className="spread"><span className="muted">Servizio HomeRest</span><span>€0.50</span></div>
                <div className="divider" style={{ margin: "6px 0" }}/>
                <div className="spread" style={{ fontWeight: 600 }}><span>Totale</span><span>€{(l.price + 0.5).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 12, padding: "0 12px" }}>
              Cancellazione gratuita fino a 30 minuti prima · Rimborso 50% in caso di no-show
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ListingDetail = ListingDetail;
