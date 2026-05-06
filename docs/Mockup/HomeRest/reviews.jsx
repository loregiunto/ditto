// Reviews screen — bidirectional review form (post-visit)
const { Icon: RvIcon } = window.HR;

const ReviewStars = ({ value, onChange, label, sub }) => (
  <div style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
    <div className="spread" style={{ alignItems: "flex-start" }}>
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => onChange(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <RvIcon.Star style={{ width: 24, height: 24, color: i <= value ? "var(--terracotta)" : "var(--ink-4)", transition: "color 120ms" }}/>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ReviewScreen = ({ listing: l, onClose, onSubmit }) => {
  const [r, setR] = React.useState({ clean: 0, welcome: 0, accuracy: 0 });
  const [text, setText] = React.useState("");
  const [step, setStep] = React.useState("review"); // review | done

  const avg = (r.clean + r.welcome + r.accuracy) / 3;
  const ready = r.clean && r.welcome && r.accuracy;

  if (step === "done") {
    return (
      <div className="scrim" onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
        <div className="sheet" style={{ padding: 32, textAlign: "center", width: "min(480px, 92vw)" }}>
          <div style={{ width: 60, height: 60, borderRadius: 99, background: "var(--terracotta-soft)", color: "var(--terracotta-deep)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <RvIcon.Heart style={{ width: 28, height: 28, fill: "currentColor" }}/>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>
            Grazie per il feedback
          </h2>
          <p className="muted" style={{ margin: "0 0 24px" }}>
            La tua recensione aiuta {l.host.split(" ")[0]} a migliorare e gli altri ospiti a scegliere meglio.
          </p>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scrim" onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="sheet" style={{ width: "min(560px, 92vw)" }}>
        <div style={{ padding: "22px 26px 14px", borderBottom: "1px solid var(--line)" }}>
          <div className="spread">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <RvIcon.Back style={{ width: 14, height: 14 }}/>
              Più tardi
            </button>
            <span className="muted" style={{ fontSize: 12 }}>Visita di oggi · 14:30</span>
          </div>
        </div>

        <div style={{ padding: 26 }}>
          <div className="row" style={{ gap: 14, marginBottom: 18 }}>
            <Photo label="" palette={l.color} style={{ width: 60, height: 60, borderRadius: 12, flexShrink: 0 }}/>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
                Com'è andata da {l.host.split(" ")[0]}?
              </h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                {l.name} · {l.neighborhood}
              </p>
            </div>
          </div>

          <ReviewStars value={r.clean} onChange={(v) => setR({...r, clean: v})}
                        label="Pulizia" sub="Bagno trovato perfettamente in ordine?"/>
          <ReviewStars value={r.welcome} onChange={(v) => setR({...r, welcome: v})}
                        label="Accoglienza" sub="L'host è stato cordiale e disponibile?"/>
          <ReviewStars value={r.accuracy} onChange={(v) => setR({...r, accuracy: v})}
                        label="Corrispondenza foto" sub="Era come nelle immagini del listing?"/>

          <div style={{ paddingTop: 18 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Lascia un commento <span className="muted" style={{ fontWeight: 400 }}>(facoltativo)</span></label>
              <textarea rows={3} placeholder={`Cosa ti è piaciuto della visita da ${l.host.split(" ")[0]}?`}
                         value={text} onChange={(e) => setText(e.target.value)}/>
              <small>{text.length} / 500 — visibile pubblicamente</small>
            </div>
          </div>

          {ready && (
            <div style={{ background: "var(--bg-sunk)", borderRadius: "var(--r-md)", padding: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <Stars value={avg} size={14}/>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{avg.toFixed(1)}</span>
              <span className="muted" style={{ fontSize: 13 }}>· valutazione media</span>
            </div>
          )}

          <button className="btn btn-accent btn-lg" disabled={!ready} style={{ width: "100%", justifyContent: "center", opacity: ready ? 1 : 0.45 }}
                  onClick={() => setStep("done")}>
            Pubblica recensione
          </button>

          <p className="hint" style={{ textAlign: "center", marginTop: 12 }}>
            Anche {l.host.split(" ")[0]} sta lasciando una recensione su di te. Le pubblichiamo entrambe insieme.
          </p>
        </div>
      </div>
    </div>
  );
};

window.ReviewScreen = ReviewScreen;
