// Main HomeRest app
const { Icon: AppIcon, LISTINGS } = window.HR;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "demoState": "default",
  "badgeStyle": "warm"
}/*EDITMODE-END*/;

const App = () => {
  const [route, setRoute] = React.useState("explore"); // explore | bookings | host | host-listing
  const [listing, setListing] = React.useState(null);
  const [booking, setBooking] = React.useState(null);
  const [reviewListing, setReviewListing] = React.useState(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [liked, setLiked] = React.useState(["l1"]);
  const [toast, setToast] = React.useState(null);
  const tweaks = useTweaks(TWEAK_DEFAULTS);
  const [tweakOpen, setTweakOpen] = React.useState(false);

  // Listen for activate/deactivate
  React.useEffect(() => {
    const h = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweakOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweakOpen(false);
    };
    window.addEventListener("message", h);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", h);
  }, []);

  const toggleLike = (id) => {
    setLiked(liked.includes(id) ? liked.filter(x => x !== id) : [...liked, id]);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const navItems = [
    { k: "explore", label: "Esplora", icon: "Compass" },
    { k: "bookings", label: "Prenotazioni", icon: "Calendar", badge: 1 },
    { k: "favorites", label: "Salvati", icon: "Heart" },
  ];
  const hostItems = [
    { k: "host", label: "Dashboard", icon: "Chart" },
    { k: "host-listing", label: "I miei bagni", icon: "Bath" },
    { k: "host-inbox", label: "Messaggi", icon: "Inbox", badge: 2 },
  ];

  const titles = {
    explore: { t: "Trova un bagno", em: "vicino a te" },
    bookings: { t: "Le tue", em: "prenotazioni" },
    favorites: { t: "Bagni", em: "salvati" },
    host: { t: "Dashboard", em: "host" },
    "host-listing": { t: "I tuoi", em: "bagni" },
    "host-inbox": { t: "Messaggi", em: "ospiti" },
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div className="brand-name">Home<em>Rest</em></div>
        </div>

        <div className="nav-section">Esplora</div>
        {navItems.map(n => {
          const I = AppIcon[n.icon];
          return (
            <button key={n.k} className={`nav-item ${route === n.k ? "active" : ""}`} onClick={() => { setRoute(n.k); setListing(null); }}>
              <I/>
              <span>{n.label}</span>
              {n.badge && <span className="badge">{n.badge}</span>}
            </button>
          );
        })}

        <div className="nav-section">Hosting</div>
        {hostItems.map(n => {
          const I = AppIcon[n.icon];
          return (
            <button key={n.k} className={`nav-item ${route === n.k ? "active" : ""}`} onClick={() => { setRoute(n.k); setListing(null); }}>
              <I/>
              <span>{n.label}</span>
              {n.badge && <span className="badge">{n.badge}</span>}
            </button>
          );
        })}

        <div className="sidebar-foot">
          <div className="avatar">GM</div>
          <div className="who">
            Giulia M.
            <small>Super Host · Firenze</small>
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <main className="canvas">
        <div className="topbar">
          <div className="topbar-title">
            {listing ? (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setListing(null)}>
                  <AppIcon.Back style={{ width: 14, height: 14 }}/>
                </button>
                <span>{listing.name}</span>
              </span>
            ) : titles[route] ? (
              <>{titles[route].t} <em>{titles[route].em}</em></>
            ) : "HomeRest"}
          </div>

          {!listing && route === "explore" && (
            <div className="search">
              <AppIcon.Search style={{ width: 16, height: 16 }}/>
              <input placeholder="Cerca via, quartiere, monumento..."/>
              <span className="sep"/>
              <span className="city">
                <AppIcon.Pin style={{ width: 14, height: 14 }}/>
                Milano · Brera
              </span>
            </div>
          )}

          <div className="topbar-actions">
            {(route === "host" || route === "host-listing" || route === "host-inbox") ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowOnboarding(true)}>
                <AppIcon.Plus/> Nuovo bagno
              </button>
            ) : (
              <button className="icon-btn">
                <AppIcon.Bell style={{ width: 16, height: 16 }}/>
                <span className="dot"/>
              </button>
            )}
            <button className="icon-btn">
              <AppIcon.Settings style={{ width: 16, height: 16 }}/>
            </button>
          </div>
        </div>

        {/* Body */}
        {listing ? (
          <ListingDetail listing={listing}
                          onBack={() => setListing(null)}
                          onBook={(l) => setBooking(l)}
                          liked={liked}
                          toggleLike={toggleLike}/>
        ) : route === "explore" ? (
          <Explore onOpenListing={(l) => setListing(l)}
                    liked={liked} toggleLike={toggleLike}
                    demoState={tweaks.demoState}/>
        ) : route === "bookings" ? (
          <MyBookings onReview={(l) => setReviewListing(l)} onOpenListing={(l) => setListing(l)}/>
        ) : route === "favorites" ? (
          <FavoritesScreen liked={liked} onOpen={(l) => setListing(l)}/>
        ) : route === "host" ? (
          <HostDashboard onCreateListing={() => setShowOnboarding(true)} onOpenListing={(l) => setListing(l)}/>
        ) : route === "host-listing" ? (
          <HostListings onCreate={() => setShowOnboarding(true)} onOpen={(l) => setListing(l)}/>
        ) : route === "host-inbox" ? (
          <InboxScreen/>
        ) : null}
      </main>

      {/* Modals */}
      {booking && (
        <BookingFlow listing={booking}
                      onClose={() => setBooking(null)}
                      onComplete={() => { setBooking(null); setListing(null); setRoute("bookings"); showToast("Prenotazione confermata"); }}/>
      )}
      {reviewListing && (
        <ReviewScreen listing={reviewListing}
                       onClose={() => setReviewListing(null)}
                       onSubmit={() => { setReviewListing(null); showToast("Recensione pubblicata"); }}/>
      )}
      {showOnboarding && (
        <HostOnboarding onClose={() => setShowOnboarding(false)}
                         onPublish={() => { setShowOnboarding(false); showToast("Listing inviato all'approvazione"); }}/>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <AppIcon.Check style={{ width: 16, height: 16 }}/>
          {toast}
        </div>
      )}

      {/* Tweaks */}
      {tweakOpen && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Stato dei bagni (demo)" subtitle="Forza tutti i listing in uno stato per vedere come reagisce la UI">
            <TweakRadio
              label="Demo state"
              value={tweaks.demoState}
              options={[
                { value: "default", label: "Mix realistico" },
                { value: "all-available", label: "Tutti disponibili" },
                { value: "all-urgent", label: "Tutti urgenti" },
                { value: "all-full", label: "Tutti al completo" },
              ]}
              onChange={(v) => tweaks.setTweak("demoState", v)}/>
          </TweakSection>
          <TweakSection title="Stile dei badge" subtitle="Anteprima delle varianti di trust badge">
            <BadgePreview style={tweaks.badgeStyle}/>
            <TweakRadio
              label="Variante"
              value={tweaks.badgeStyle}
              options={[
                { value: "warm", label: "Warm" },
                { value: "mono", label: "Monocromo" },
                { value: "outline", label: "Outline" },
              ]}
              onChange={(v) => tweaks.setTweak("badgeStyle", v)}/>
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
};

// Simple favorites screen
const FavoritesScreen = ({ liked, onOpen }) => {
  const items = LISTINGS.filter(l => liked.includes(l.id));
  return (
    <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="section-head">
          <div>
            <div className="section-title">I tuoi <em>preferiti</em></div>
            <div className="section-sub">{items.length} bagni salvati</div>
          </div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--ink-3)" }}>
            <AppIcon.Heart style={{ width: 32, height: 32, margin: "0 auto 12px", display: "block" }}/>
            Nessun preferito ancora. Tocca il cuore su un bagno per salvarlo.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {items.map(l => (
              <div key={l.id} className="listing-card" onClick={() => onOpen(l)}>
                <div className="listing-photo" style={{ position: "relative" }}>
                  <Photo label={l.photos[0]} palette={l.color} style={{ position: "absolute", inset: 0 }}/>
                  <div className="price-tag">€{l.price}/h</div>
                </div>
                <div className="listing-body">
                  <div className="listing-head">
                    <div>
                      <div className="listing-name">{l.name}</div>
                      <div className="listing-meta">{l.neighborhood} · {l.city}</div>
                    </div>
                    <div className="rating"><AppIcon.Star/>{l.rating}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HostListings = ({ onCreate, onOpen }) => {
  const mine = [LISTINGS[0]];
  return (
    <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="section-head">
          <div>
            <div className="section-title">I tuoi <em>bagni</em></div>
            <div className="section-sub">{mine.length} pubblicato</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onCreate}>
            <AppIcon.Plus/> Aggiungi bagno
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {mine.map(l => (
            <div key={l.id} className="listing-card" onClick={() => onOpen(l)}>
              <div className="listing-photo" style={{ position: "relative" }}>
                <Photo label={l.photos[0]} palette={l.color} style={{ position: "absolute", inset: 0 }}/>
                <span style={{ position: "absolute", top: 12, left: 12, background: "var(--sage)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99 }}>
                  Pubblicato
                </span>
                <div className="price-tag">€{l.price}/h</div>
              </div>
              <div className="listing-body">
                <div className="listing-name">{l.name}</div>
                <div className="listing-meta">{l.area}, {l.neighborhood}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {l.badges.map(b => <Badge key={b} kind={b}/>)}
                </div>
              </div>
            </div>
          ))}
          <button onClick={onCreate} style={{ border: "1.5px dashed var(--line-strong)", background: "transparent", borderRadius: "var(--r-lg)", padding: 30, cursor: "pointer", fontFamily: "inherit", color: "var(--ink-3)", display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <AppIcon.Plus style={{ width: 22, height: 22, margin: "0 auto 8px" }}/>
              <div style={{ fontWeight: 500 }}>Pubblica un altro bagno</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const InboxScreen = () => {
  const msgs = [
    { id: "m1", who: "Marco F.", what: "Posso arrivare 10 minuti prima?", when: "5 min fa", unread: true, listing: "Bagno del Cortile" },
    { id: "m2", who: "Sofia R.", what: "Grazie per l'accoglienza, è stato perfetto!", when: "1 ora fa", unread: true, listing: "Bagno del Cortile" },
    { id: "m3", who: "Federico V.", what: "Domani porto un amico, va bene se entriamo insieme?", when: "Ieri", unread: false, listing: "Bagno del Cortile" },
  ];
  return (
    <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="section-head">
          <div>
            <div className="section-title"><em>Messaggi</em> con gli ospiti</div>
            <div className="section-sub">2 non letti</div>
          </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {msgs.map(m => (
            <div key={m.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", gap: 14, alignItems: "center", cursor: "pointer", background: m.unread ? "var(--bg-elev)" : "transparent" }}>
              <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{m.who.split(" ").map(s => s[0]).join("")}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="spread">
                  <span style={{ fontWeight: m.unread ? 600 : 500, fontSize: 14 }}>{m.who}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{m.when}</span>
                </div>
                <div style={{ fontSize: 13, color: m.unread ? "var(--ink)" : "var(--ink-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.what}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{m.listing}</div>
              </div>
              {m.unread && <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--terracotta)" }}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Badge style preview for tweaks
const BadgePreview = ({ style }) => {
  const styleMap = {
    warm: {},
    mono: { filter: "grayscale(1)" },
    outline: { background: "transparent", border: "1px solid currentColor" },
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
      {["private", "business", "verified", "super"].map(k => (
        <div key={k} style={styleMap[style] || {}}>
          <Badge kind={k}/>
        </div>
      ))}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
