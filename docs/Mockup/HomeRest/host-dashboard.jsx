// Host dashboard — bookings, earnings, listing performance
const { Icon: HdIcon, LISTINGS } = window.HR;

const HostDashboard = ({ onCreateListing, onOpenListing }) => {
  const upcoming = [
    { id: "u1", name: "Marco F.", time: "Oggi 14:30", duration: 30, listing: "Bagno del Cortile", status: "confirmed", price: 4 },
    { id: "u2", name: "Luca P.", time: "Oggi 16:00", duration: 60, listing: "Bagno del Cortile", status: "pending", price: 8 },
    { id: "u3", name: "Sofia R.", time: "Domani 09:30", duration: 30, listing: "Bagno del Cortile", status: "confirmed", price: 4 },
    { id: "u4", name: "Federico V.", time: "Domani 11:00", duration: 30, listing: "Bagno del Cortile", status: "confirmed", price: 4 },
    { id: "u5", name: "Chiara M.", time: "Ven 8 mag · 18:00", duration: 45, listing: "Bagno del Cortile", status: "confirmed", price: 6 },
  ];

  const myListing = LISTINGS[0]; // Bagno del Cortile

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 60px" }}>
        <div className="section-head">
          <div>
            <div className="section-title">Buongiorno, <em>Giulia</em></div>
            <div className="section-sub">Hai 2 prenotazioni oggi · ultima recensione ★ 5.0</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm">
              <HdIcon.Calendar/>
              Disponibilità
            </button>
            <button className="btn btn-primary btn-sm" onClick={onCreateListing}>
              <HdIcon.Plus/>
              Nuovo bagno
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <div className="kpi">
            <div className="kpi-label">Guadagno mese</div>
            <div className="kpi-val">€ 312<span style={{ color: "var(--ink-3)", fontSize: 22 }}>,40</span></div>
            <div className="kpi-trend">↑ 18% vs aprile</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Prenotazioni</div>
            <div className="kpi-val">42</div>
            <div className="kpi-trend">↑ 6 nuove ospiti</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Valutazione</div>
            <div className="kpi-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              4,92 <HdIcon.Star style={{ width: 22, height: 22, color: "var(--terracotta)" }}/>
            </div>
            <div className="kpi-trend">★ 5.0 ultime 8 visite</div>
          </div>
          <div className="kpi" style={{ background: "var(--amber-soft)", border: "none" }}>
            <div className="kpi-label" style={{ color: "oklch(0.42 0.10 70)" }}>Status</div>
            <div className="kpi-val" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, color: "oklch(0.42 0.10 70)", whiteSpace: "nowrap" }}>
              <HdIcon.Crown style={{ width: 20, height: 20, flexShrink: 0 }}/>
              Super Host
            </div>
            <div className="kpi-trend" style={{ color: "oklch(0.42 0.10 70)" }}>Soglia 96% mantenuta</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
          {/* Upcoming bookings */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)" }}>
              <div className="spread">
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, margin: 0 }}>Prossime visite</h3>
                <button className="btn btn-sm btn-ghost">Vedi tutte</button>
              </div>
            </div>
            <div>
              {upcoming.map(u => (
                <div key={u.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>
                    {u.name.split(" ").map(s => s[0]).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</span>
                      {u.status === "pending" && (
                        <span className="badge-pill badge-rose" style={{ background: "oklch(0.95 0.05 60)", color: "oklch(0.42 0.10 60)" }}>
                          Da approvare
                        </span>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.time} · {u.duration} min</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>€{u.price.toFixed(2)}</div>
                    <div className="muted" style={{ fontSize: 11, whiteSpace: "nowrap" }}>netto €{(u.price * 0.9).toFixed(2)}</div>
                  </div>
                  {u.status === "pending" && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-sm">Rifiuta</button>
                      <button className="btn btn-primary btn-sm">Accetta</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Earnings chart */}
          <div className="card" style={{ padding: 20 }}>
            <div className="spread" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, margin: 0 }}>Guadagni · 30 gg</h3>
              <div className="tabs" style={{ background: "var(--bg-sunk)" }}>
                <button>7g</button>
                <button className="active">30g</button>
                <button>1a</button>
              </div>
            </div>

            {/* Bar chart */}
            <svg viewBox="0 0 320 130" style={{ width: "100%", height: 160 }}>
              <line x1="0" y1="110" x2="320" y2="110" stroke="var(--line)" strokeWidth="1"/>
              {[8, 14, 6, 18, 12, 22, 10, 16, 4, 12, 20, 16, 24, 18, 12, 26, 30, 22, 16, 28, 32, 24, 18, 14, 22, 28, 34, 26, 18, 12].map((v, i) => (
                <rect key={i}
                       x={6 + i * 10.4} y={110 - v * 2.6}
                       width="6" height={v * 2.6}
                       rx="2"
                       fill={i === 26 ? "var(--terracotta)" : "var(--ink)"}
                       opacity={i === 26 ? 1 : 0.85 - (29 - i) * 0.018}/>
              ))}
            </svg>

            <div className="spread" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Netto incassato</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>€ 281,16</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: 12 }}>Commissione HomeRest</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink-3)" }}>€ 31,24</div>
              </div>
            </div>

            <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
              <HdIcon.Wallet/>
              Vai al portafoglio Stripe
            </button>
          </div>
        </div>

        {/* My listing */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, margin: "0 0 14px" }}>I tuoi bagni</h3>
          <div className="card" style={{ padding: 0, display: "grid", gridTemplateColumns: "200px 1fr auto", alignItems: "stretch" }}>
            <Photo label={myListing.photos[0]} palette={myListing.color} style={{ height: 140 }}/>
            <div style={{ padding: "16px 20px" }}>
              <div className="spread">
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>{myListing.name}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{myListing.area}, {myListing.neighborhood}, {myListing.city} · pubblicato il 12 mar 2024</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {myListing.badges.map(b => <Badge key={b} kind={b}/>)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 18 }}>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prezzo</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>€{myListing.price}/h</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasso accettazione</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>96%</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tempo risposta</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>~ 8 min</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Visite mese</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>42</div>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", borderLeft: "1px solid var(--line)" }}>
              <button className="btn btn-sm" onClick={() => onOpenListing(myListing)}>Anteprima</button>
              <button className="btn btn-sm btn-primary">Modifica</button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div style={{ marginTop: 22, padding: 20, background: "var(--terracotta-soft)", borderRadius: "var(--r-lg)", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-elev)", display: "grid", placeItems: "center", color: "var(--terracotta-deep)", flexShrink: 0 }}>
            <HdIcon.Sparkle style={{ width: 22, height: 22 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: "var(--terracotta-deep)" }}>Aggiungi 2 fasce serali per +18% di guadagno</div>
            <div style={{ fontSize: 14, color: "var(--terracotta-deep)", opacity: 0.85, marginTop: 2 }}>
              I turisti cercano bagni soprattutto tra le 19 e 21. Hai disponibilità in queste fasce solo il 30% dei giorni.
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: "var(--bg-elev)" }}>Apri calendario</button>
        </div>
      </div>
    </div>
  );
};

window.HostDashboard = HostDashboard;
