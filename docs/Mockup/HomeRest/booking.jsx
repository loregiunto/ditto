// Booking flow — multi-step
const { Icon: BkIcon } = window.HR;

const SLOTS = [
  { time: "13:00", state: "open" },
  { time: "13:30", state: "open" },
  { time: "14:00", state: "taken" },
  { time: "14:30", state: "open" },
  { time: "15:00", state: "urgent" },
  { time: "15:30", state: "urgent" },
  { time: "16:00", state: "open" },
  { time: "16:30", state: "open" },
  { time: "17:00", state: "taken" },
  { time: "17:30", state: "open" },
  { time: "18:00", state: "open" },
  { time: "18:30", state: "open" },
];

const StepDots = ({ step, total = 3 }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    {Array.from({ length: total }).map((_, i) => (
      <span key={i} style={{
        width: i === step ? 24 : 8,
        height: 8,
        borderRadius: 99,
        background: i <= step ? "var(--ink)" : "var(--line-strong)",
        transition: "all 200ms",
      }}/>
    ))}
  </div>
);

const BookingFlow = ({ listing: l, onClose, onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [time, setTime] = React.useState("14:30");
  const [duration, setDuration] = React.useState(30);
  const [card, setCard] = React.useState({ number: "4242 4242 4242 4242", exp: "12/28", cvc: "123" });

  const total = (l.price * (duration / 60)) + 0.5;

  return (
    <div className="scrim" onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="sheet" style={{ width: "min(620px, 92vw)" }}>
        <div style={{ padding: "22px 26px 14px", borderBottom: "1px solid var(--line)" }}>
          <div className="spread">
            <button className="btn btn-ghost btn-sm" onClick={() => step === 0 ? onClose() : setStep(step - 1)}>
              <BkIcon.Back style={{ width: 14, height: 14 }}/>
              {step === 0 ? "Annulla" : "Indietro"}
            </button>
            <StepDots step={step}/>
            <span className="muted" style={{ fontSize: 12 }}>{step + 1} / 3</span>
          </div>
        </div>

        {step === 0 && (
          <div style={{ padding: "26px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>
              Quando ti serve?
            </h2>
            <p className="muted" style={{ margin: "0 0 22px" }}>{l.name} · {l.neighborhood}, {l.city}</p>

            <div className="tabs" style={{ marginBottom: 18 }}>
              <button className="active">Oggi · mer 6</button>
              <button>Dom 7</button>
              <button>Lun 8</button>
              <button>Mar 9</button>
            </div>

            <div className="spread" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>Fascia oraria</div>
              <div className="muted" style={{ fontSize: 12 }}>· slot rosso = ultimi posti</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
              {SLOTS.map(s => (
                <button key={s.time}
                        className={`slot ${time === s.time ? "selected" : ""} ${s.state === "taken" ? "disabled" : ""} ${s.state === "urgent" && time !== s.time ? "urgent" : ""}`}
                        disabled={s.state === "taken"}
                        onClick={() => setTime(s.time)}>
                  {s.time}
                </button>
              ))}
            </div>

            <div className="spread" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>Durata</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
              {[15, 30, 45, 60].map(d => (
                <button key={d} className={`slot ${duration === d ? "selected" : ""}`} onClick={() => setDuration(d)}>
                  {d} min
                </button>
              ))}
            </div>

            <button className="btn btn-accent btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStep(1)}>
              Continua · €{total.toFixed(2)}
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: 26 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 6px" }}>
              Riepilogo e pagamento
            </h2>
            <p className="muted" style={{ margin: "0 0 22px" }}>Verrai addebitato solo dopo la conferma di {l.host.split(" ")[0]}.</p>

            {/* Summary card */}
            <div className="card" style={{ padding: 16, marginBottom: 18 }}>
              <div className="row" style={{ gap: 14 }}>
                <Photo label="" palette={l.color} style={{ width: 80, height: 80, borderRadius: 12, flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{l.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{l.neighborhood} · oggi alle {time} · {duration} min</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {l.badges.slice(0, 2).map(b => <Badge key={b} kind={b}/>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="field">
              <label>Metodo di pagamento</label>
              <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, display: "flex", alignItems: "center", gap: 12, background: "var(--bg-elev)" }}>
                <div style={{ width: 36, height: 24, borderRadius: 4, background: "linear-gradient(135deg, #1A1F71, #4061B5)", flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>Visa terminante in 4242</div>
                  <div className="muted" style={{ fontSize: 12 }}>Scadenza 12/28</div>
                </div>
                <button className="btn btn-sm btn-ghost">Cambia</button>
              </div>
            </div>

            {/* Bill */}
            <div style={{ background: "var(--bg-sunk)", borderRadius: "var(--r-md)", padding: 14, marginBottom: 18, fontSize: 14 }}>
              <div className="spread" style={{ marginBottom: 6 }}><span className="muted">€{l.price} × {duration / 60} ora</span><span>€{(l.price * duration / 60).toFixed(2)}</span></div>
              <div className="spread" style={{ marginBottom: 6 }}><span className="muted">Servizio HomeRest</span><span>€0.50</span></div>
              <div className="divider" style={{ margin: "10px 0" }}/>
              <div className="spread" style={{ fontWeight: 600 }}><span>Totale</span><span>€{total.toFixed(2)}</span></div>
            </div>

            <div className="hint" style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 18 }}>
              <BkIcon.Shield style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }}/>
              <span>Cancellazione gratuita fino a 30 min prima. In caso di no-show, ti verrà addebitato il 50%.</span>
            </div>

            <button className="btn btn-accent btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStep(2)}>
              Conferma e prenota · €{total.toFixed(2)}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: "var(--sage-soft)", color: "oklch(0.42 0.08 145)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
              <BkIcon.Check style={{ width: 32, height: 32 }}/>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
              Prenotazione confermata
            </h2>
            <p className="muted" style={{ margin: "0 0 24px" }}>{l.host.split(" ")[0]} ti aspetta oggi alle {time}.</p>

            <div className="card" style={{ padding: 20, textAlign: "left", marginBottom: 18 }}>
              <div className="spread" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 500 }}>Indirizzo</div>
                <Badge kind="verified"/>
              </div>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink)", marginBottom: 4 }}>
                {l.area}, 27 — interno 4
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {l.neighborhood}, {l.city} · 1° piano · citofono "{l.host.split(" ")[0]}"
              </div>
              <div className="divider"/>
              <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                <strong>Istruzioni di {l.host.split(" ")[0]}:</strong> Suona il citofono, prendi le scale a destra. Ti aspetto sulla porta. Se la porta è chiusa, sono in cucina — scrivimi pure.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-lg" style={{ flex: 1, justifyContent: "center" }}>Apri in mappe</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: "center" }} onClick={onComplete}>
                Vedi prenotazione
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.BookingFlow = BookingFlow;
