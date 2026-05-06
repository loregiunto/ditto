// Host onboarding flow — create listing
const { Icon: OnIcon } = window.HR;

const STEPS = [
  { key: "type", label: "Tipo di host" },
  { key: "verify", label: "Verifica identità" },
  { key: "place", label: "Il bagno" },
  { key: "photos", label: "Foto" },
  { key: "price", label: "Prezzo & disponibilità" },
  { key: "publish", label: "Pubblica" },
];

const HostOnboarding = ({ onClose, onPublish }) => {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    hostType: "private",
    name: "",
    address: "",
    desc: "",
    price: 4,
    instant: true,
  });

  const next = () => setStep(Math.min(step + 1, STEPS.length - 1));
  const prev = () => step === 0 ? onClose() : setStep(step - 1);

  return (
    <div className="scrim" style={{ alignItems: "stretch", padding: 0 }} onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="sheet" style={{
        width: "min(960px, 96vw)",
        maxHeight: "94vh",
        margin: "auto",
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        padding: 0,
        overflow: "hidden",
      }}>
        {/* Steps rail */}
        <div style={{ padding: "26px 22px", background: "var(--bg-sunk)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em" }}>
              Pubblica il tuo bagno
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>~ 6 minuti</div>
          </div>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px" }}>
              <div style={{
                width: 22, height: 22, borderRadius: 99,
                background: i < step ? "var(--ink)" : i === step ? "var(--terracotta)" : "var(--bg-elev)",
                color: i <= step ? "#fff" : "var(--ink-3)",
                border: i > step ? "1px solid var(--line-strong)" : "none",
                display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 600,
                flexShrink: 0,
              }}>
                {i < step ? <OnIcon.Check style={{ width: 12, height: 12 }}/> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i === step ? 500 : 400, color: i === step ? "var(--ink)" : "var(--ink-3)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "94vh" }}>
          <div style={{ padding: "26px 32px", overflowY: "auto", flex: 1 }}>
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Sei un privato o un'attività?</h2>
                <p className="muted" style={{ margin: "0 0 22px" }}>Influisce su verifica identità e badge che riceverai.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { k: "private", icon: "Home", title: "Privato", sub: "Apro il mio bagno di casa qualche ora a settimana." },
                    { k: "business", icon: "Storefront", title: "Attività commerciale", sub: "Bar, hotel, atelier, coworking, spa." },
                  ].map(o => {
                    const I = OnIcon[o.icon];
                    const sel = data.hostType === o.k;
                    return (
                      <button key={o.k}
                              onClick={() => setData({...data, hostType: o.k})}
                              style={{
                                textAlign: "left", cursor: "pointer",
                                padding: 20,
                                background: sel ? "var(--ink)" : "var(--bg-elev)",
                                color: sel ? "var(--bg)" : "var(--ink)",
                                border: `1.5px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                                borderRadius: "var(--r-lg)",
                                fontFamily: "inherit",
                              }}>
                        <I style={{ width: 28, height: 28, marginBottom: 12, color: sel ? "var(--bg)" : "var(--terracotta)" }}/>
                        <div style={{ fontWeight: 500, fontSize: 17, marginBottom: 4 }}>{o.title}</div>
                        <div style={{ fontSize: 13, opacity: sel ? 0.75 : 1, color: sel ? "var(--bg)" : "var(--ink-3)" }}>{o.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Verifichiamo chi sei</h2>
                <p className="muted" style={{ margin: "0 0 22px" }}>
                  La verifica è obbligatoria per tutti gli host. È rapida e gestita da Stripe Identity.
                </p>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { i: "Camera", t: "Carta d'identità o passaporto", s: "Fotografia di entrambi i lati" },
                    { i: "Sparkle", t: "Selfie di verifica", s: "Confronto automatico col documento" },
                    { i: "Wallet", t: "Conto Stripe Connect", s: "Per ricevere i pagamenti delle visite" },
                  ].map((o, i) => {
                    const I = OnIcon[o.i];
                    return (
                      <div key={i} className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-sunk)", display: "grid", placeItems: "center" }}>
                          <I style={{ width: 20, height: 20 }}/>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{o.t}</div>
                          <div className="muted" style={{ fontSize: 13 }}>{o.s}</div>
                        </div>
                        <Badge kind="verified" mode="icon"/>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "var(--sage-soft)", padding: 14, borderRadius: "var(--r-md)", marginTop: 18, fontSize: 13, color: "oklch(0.32 0.06 145)" }}>
                  <strong>Privacy:</strong> il tuo indirizzo è visibile agli ospiti solo dopo la conferma di una prenotazione. Mai pubblicamente.
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Raccontaci del bagno</h2>
                <p className="muted" style={{ margin: "0 0 22px" }}>Le descrizioni con dettagli specifici ricevono +35% di prenotazioni.</p>

                <div className="field">
                  <label>Nome del listing</label>
                  <input value={data.name} onChange={(e) => setData({...data, name: e.target.value})} placeholder="es. Bagno del cortile fiorentino"/>
                  <small>Ai turisti piacciono i nomi che richiamano un luogo o un dettaglio</small>
                </div>
                <div className="field">
                  <label>Indirizzo</label>
                  <input value={data.address} onChange={(e) => setData({...data, address: e.target.value})} placeholder="Via, civico, città"/>
                  <small>Resta privato fino alla conferma · solo il quartiere è visibile sulla mappa</small>
                </div>
                <div className="field">
                  <label>Descrizione</label>
                  <textarea rows={4} value={data.desc} onChange={(e) => setData({...data, desc: e.target.value})}
                             placeholder="Stile, dettagli speciali, atmosfera, accesso..."/>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Aggiungi le foto</h2>
                <p className="muted" style={{ margin: "0 0 22px" }}>Almeno 3 foto. La prima è quella che vedono per prima.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1 / 1" }}>
                      {i < 3 ? (
                        <Photo label={["Bagno principale", "Lavabo", "Dettaglio"][i]} palette={["warmCream", "rose", "sage"][i]} style={{ position: "absolute", inset: 0, borderRadius: 12 }}/>
                      ) : (
                        <div style={{ position: "absolute", inset: 0, border: "1.5px dashed var(--line-strong)", borderRadius: 12, display: "grid", placeItems: "center", color: "var(--ink-3)", cursor: "pointer", background: "var(--bg-sunk)" }}>
                          <div style={{ textAlign: "center" }}>
                            <OnIcon.Plus style={{ width: 22, height: 22 }}/>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Aggiungi foto</div>
                          </div>
                        </div>
                      )}
                      {i === 0 && (
                        <span style={{ position: "absolute", top: 10, left: 10, background: "var(--ink)", color: "var(--bg)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99 }}>
                          Copertina
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Quanto costa l'accesso?</h2>
                <p className="muted" style={{ margin: "0 0 22px" }}>Il prezzo medio nella tua zona è €4–6 per ora.</p>

                <div className="card" style={{ padding: 22, marginBottom: 18, textAlign: "center" }}>
                  <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prezzo orario</div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 6 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 500, letterSpacing: "-0.03em" }}>€{data.price}</span>
                    <span className="muted">/ ora</span>
                  </div>
                  <input type="range" min="2" max="12" value={data.price} onChange={(e) => setData({...data, price: +e.target.value})}
                         style={{ width: "100%", marginTop: 18, accentColor: "var(--terracotta)" }}/>
                  <div className="spread" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
                    <span>€2</span><span>Trattieni il 90% — €{(data.price * 0.9).toFixed(2)}/h</span><span>€12</span>
                  </div>
                </div>

                <div className="field">
                  <label>Modalità di prenotazione</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { k: true, t: "Istantanea", s: "Conferma automatica · più prenotazioni", icon: "Bolt" },
                      { k: false, t: "Su richiesta", s: "Approvi tu manualmente entro 30 min", icon: "Check" },
                    ].map(o => {
                      const I = OnIcon[o.icon];
                      const sel = data.instant === o.k;
                      return (
                        <button key={String(o.k)}
                                onClick={() => setData({...data, instant: o.k})}
                                style={{
                                  textAlign: "left", cursor: "pointer", padding: 14,
                                  background: sel ? "var(--ink)" : "var(--bg-elev)",
                                  color: sel ? "var(--bg)" : "var(--ink)",
                                  border: `1.5px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                                  borderRadius: "var(--r-md)", fontFamily: "inherit",
                                }}>
                          <I style={{ width: 18, height: 18, marginBottom: 8 }}/>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{o.t}</div>
                          <div style={{ fontSize: 12, opacity: sel ? 0.75 : 1, color: sel ? "var(--bg)" : "var(--ink-3)", marginTop: 3 }}>{o.s}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: 99, background: "var(--terracotta-soft)", color: "var(--terracotta-deep)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
                  <OnIcon.Sparkle style={{ width: 32, height: 32 }}/>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>Tutto pronto, Giulia</h2>
                <p className="muted" style={{ margin: "0 0 24px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
                  Il tuo bagno verrà pubblicato dopo l'approvazione del team (di solito entro 24h).
                </p>

                <div className="card" style={{ padding: 16, textAlign: "left", maxWidth: 380, margin: "0 auto" }}>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <Photo label="" palette="warmCream" style={{ width: 64, height: 64, borderRadius: 12 }}/>
                    <div>
                      <div style={{ fontWeight: 500 }}>{data.name || "Nuovo bagno"}</div>
                      <div className="muted" style={{ fontSize: 13 }}>€{data.price}/ora · {data.instant ? "Istantanea" : "Su richiesta"}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <Badge kind={data.hostType}/>
                        <Badge kind="verified"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 32px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10, background: "var(--bg)" }}>
            <button className="btn" onClick={prev}>
              <OnIcon.Back style={{ width: 14, height: 14 }}/>
              {step === 0 ? "Annulla" : "Indietro"}
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-accent" onClick={next}>
                {step === 1 ? "Avvia verifica" : "Continua"}
                <OnIcon.Arrow style={{ width: 14, height: 14 }}/>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onPublish}>
                Pubblica il bagno
                <OnIcon.Check style={{ width: 14, height: 14 }}/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.HostOnboarding = HostOnboarding;
