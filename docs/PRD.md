# HomeRest — Product Requirements Document

**Author:** Archetipo
**Date:** 2026-05-06
**Version:** 1.0

---

## Elevator Pitch

> Per **turisti e lavoratori in trasferta**, che hanno il problema di non trovare un bagno pulito, privato e accessibile in città, **HomeRest** è una **piattaforma marketplace** che permette di prenotare bagni privati e di attività in pochi tap. A differenza dei **bar e locali pubblici**, il nostro prodotto offre **pulizia garantita dalle recensioni, intimità di uno spazio privato, e la possibilità di un momento di connessione autentica con i local**.

---

## Vision

HomeRest trasforma ogni bagno privato in un'opportunità di ospitalità urbana: un luogo sicuro, curato e prenotabile, che connette chi ha bisogno con chi ha spazio — creando valore reciproco e piccoli momenti di umanità nelle città.

### Product Differentiator

Non stiamo vendendo un bagno. Stiamo vendendo **fiducia, pulizia e connessione umana** — qualcosa che nessun bar o app di mappe può offrire. La privacy dell'host è preservata (nessuna esposizione pubblica non controllata), la qualità è garantita dalle recensioni bidirezionali, e l'incontro tra host e utente diventa un'esperienza autentica di ospitalità locale.

---

## User Personas

### Persona 1: Marco Ferretti — "Il Cercatore"

**Ruolo:** Consulente aziendale in trasferta
**Età:** 38 | **Background:** Lavora per una società di consulenza milanese, viaggia tra Roma, Milano e Torino ogni settimana. Conosce bene le città ma non ha punti fissi di riferimento.

**Goals:**
- Trovare rapidamente un bagno pulito e disponibile senza imbarazzo
- Non perdere tempo in ricerche o speranze con i bar
- Avere certezza *prima* di spostarsi (disponibilità reale, non teorica)

**Pain Points:**
- I bar spesso rifiutano i non-clienti o hanno bagni in condizioni pessime
- Google Maps non mostra disponibilità reale né standard di pulizia
- Situazioni di urgenza in zone non familiari sono fonte di stress elevato

**Behaviors & Tools:**
- Usa smartphone costantemente, è abituato ad app di servizi on-demand (Uber, Booking, Glovo)
- Prenota sempre in anticipo quando può, preferisce la certezza alla improvvisazione
- Lascia recensioni quando l'esperienza è molto positiva o molto negativa

**Motivazioni:** Efficienza, discrezione, affidabilità
**Tech Savviness:** Alta

#### Customer Journey — Marco Ferretti

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Vede un post sui social o ne sente parlare da un collega | "Esiste davvero un'app per questo?" | Curiosità + scetticismo | Testimonial da lavoratori in trasferta, UGC autentico |
| Consideration | Scarica l'app e esplora i bagni nella sua zona | "Ci sono abbastanza opzioni vicino a dove vado?" | Interesse cauto | Mostrare la densità di listing nella sua città |
| First Use | Prenota il primo bagno in una situazione di urgenza | "Speriamo che sia come nelle foto" | Tensione → sollievo | Onboarding rapido, conferma immediata, indicazioni precise |
| Regular Use | Usa HomeRest ogni settimana nelle città in trasferta | "Ho il mio host preferito a Roma" | Fiducia, abitudine | Abbonamento per frequenti, profili host salvati |
| Advocacy | Consiglia l'app a colleghi in trasferta | "Vi ha salvato la vita anche a voi?" | Soddisfazione, umorismo | Referral program, condivisione facile |

---

### Persona 2: Giulia Marchetti — "L'Host Curiosa"

**Ruolo:** Residente in centro storico, impiegata part-time
**Età:** 54 | **Background:** Vive da vent'anni in un appartamento nel centro di Firenze. Ha un bagno ospiti che non usa quasi mai. Non è su Airbnb perché non vuole estranei che dormono in casa.

**Goals:**
- Guadagnare qualcosa di extra senza stravolgere la propria routine
- Incontrare persone interessanti in modo controllato e sicuro
- Sentirsi utile e parte di una comunità di ospitalità locale

**Pain Points:**
- Non ha gli strumenti per gestire richieste spontanee in modo sicuro
- Teme comportamenti scorretti (bagno lasciato sporco, persone poco affidabili)
- Non vuole che il suo indirizzo sia visibile pubblicamente senza controllo

**Behaviors & Tools:**
- Usa smartphone per comunicazioni e social (WhatsApp, Facebook)
- Preferisce interfacce semplici, si fida delle piattaforme con recensioni verificate
- Ama l'idea di "fare del bene" oltre che guadagnare

**Motivazioni:** Guadagno extra, ospitalità, controllo sulla propria casa
**Tech Savviness:** Media

#### Customer Journey — Giulia Marchetti

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Sente parlare di HomeRest da un'amica o vede un articolo | "Non avrei mai pensato di poter guadagnare così" | Sorpresa, curiosità | PR locale, community di host |
| Consideration | Legge le FAQ sulla privacy e sicurezza | "Ma chi mi entra in casa? Come mi proteggo?" | Diffidenza → rassicurazione | Pagina dedicata alla sicurezza host, verifica utenti |
| First Use | Crea il listing, fa le foto, imposta disponibilità | "Speriamo sia semplice" | Apprensione → orgoglio | Onboarding guidato passo-passo, supporto chat |
| Regular Use | Gestisce 3-4 prenotazioni a settimana, riceve recensioni positive | "Mi piace sapere chi viene da me" | Soddisfazione, senso di comunità | Dashboard host, statistiche guadagni |
| Advocacy | Consiglia HomeRest ad altri residenti nel quartiere | "È un modo carino di aprire casa" | Calore, orgoglio locale | Referral host, badge "Ambasciatore di quartiere" |

---

## Brainstorming Insights

> Scoperte chiave e direzioni alternative esplorate durante la sessione di inception.

### Assunzioni Sfidate

1. **"È come Airbnb ma per bagni"** — sfidato: il bagno privato richiede un livello di fiducia radicalmente diverso dal dormire in casa d'altri. Il modello deve essere costruito attorno alla fiducia, non dato per scontato.
2. **"Il competitor sono le altre app di bagni"** — sfidato: il vero competitor è il bar sotto casa e McDonald's. La vittoria passa da pulizia certificata, intimità e accoglienza — non solo dalla comodità.
3. **"Gli host saranno solo privati"** — sfidato ed espanso: B&B, piccoli hotel, studi professionali con bagni ospiti inutilizzati sono un segmento B2B ad alto potenziale.

### Nuove Direzioni Scoperte

- **"Bagno del giorno"**: listing con caratteristiche speciali (vista, design, giardino) promossi come esperienze premium a prezzo più alto.
- **Badge differenzianti** per tipo di host (Privato / Attività Commerciale / Super Host / Verificato) — trasparenza che abbassa la barriera di fiducia.
- **Connessione umana come valore**: l'incontro breve tra host e utente non è un problema da nascondere, ma un differenziatore da valorizzare.

---

## Product Scope

### MVP — Minimum Viable Product

- Registrazione e verifica identità host (documento via Stripe Identity)
- Listing bagno con foto, descrizione, prezzo orario e fasce di disponibilità
- Mappa interattiva (Mapbox) con bagni disponibili in tempo reale
- Prenotazione istantanea o con conferma host
- Pagamento via Stripe Connect (commissione 10% automatica)
- Recensioni bidirezionali post-visita
- Policy di cancellazione: rimborso totale se cancellato, rimborso parziale (50%) per no-show
- Badge identificativo: Privato / Attività Commerciale

### Growth Features (Post-MVP)

- Badge "Super Host" e "Verificato" per host di qualità
- Filtri avanzati (prezzo, tipo host, accessibilità, distanza, valutazione)
- Abbonamento mensile per utenti frequenti (lavoratori in trasferta)
- Listing sponsorizzati e "Bagno del giorno" per host premium
- Dashboard host con statistiche guadagni e andamento recensioni
- Notifiche push avanzate e promemoria prenotazione

### Vision (Future)

- Espansione B2B strutturata (hotel, palestre, coworking)
- Programma fedeltà con punti e reward
- Integrazione con Google Maps / Apple Maps come layer di dati
- Community features: host consigliano host, gruppi di quartiere
- Espansione internazionale (mercati turistici EU prioritari)

---

## Technical Architecture

> **Proposta da:** Leonardo (Architect)

### System Architecture

HomeRest è costruito come **Monolite Modulare** su Next.js 15 App Router — scelta pragmatica per un MVP marketplace che permette sviluppo rapido, debugging semplice e scalabilità orizzontale quando necessario.

**Architectural Pattern:** Modular Monolith (Next.js App Router)

**Main Components:**
- **Frontend:** React Server Components + Client Components per interazioni real-time
- **Backend API:** Next.js Route Handlers (REST)
- **Database:** Supabase PostgreSQL via Prisma ORM
- **Auth:** Supabase OAuth (Google + GitHub) — boilerplate esistente
- **Storage:** Supabase Storage per foto dei bagni
- **Payments:** Stripe Connect per marketplace payments
- **Maps:** Mapbox GL JS per mappa interattiva e geolocalizzazione
- **Identity Verification:** Stripe Identity per verifica documenti host

### Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Language | TypeScript | 5.x | Type safety, DX superiore |
| Frontend + Backend | Next.js (App Router) | 15.x | Boilerplate esistente, SSR + API in un unico progetto |
| UI Components | shadcn/ui | Latest | Boilerplate esistente, componenti accessibili e customizzabili |
| Styling | Tailwind CSS | v4 | Boilerplate esistente, utility-first |
| Database | Supabase PostgreSQL | — | Boilerplate esistente, managed, scalabile |
| ORM | Prisma | 5.x | Boilerplate esistente, type-safe queries |
| Auth | Supabase OAuth | — | Boilerplate esistente, GitHub + Google |
| Storage | Supabase Storage | — | Boilerplate esistente, per foto bagni |
| Payments | Stripe Connect | — | Marketplace payments, commissioni automatiche |
| Maps | Mapbox GL JS | 3.x | Mappa interattiva, clustering, geocoding |
| Identity | Stripe Identity | — | Verifica documenti host, integrazione nativa Stripe |
| Testing | Vitest + Playwright | — | Unit + E2E |

### Project Structure

**Organizational pattern:** Feature-based modules dentro App Router

```
src/
  app/
    layout.tsx
    page.tsx                    # Home con mappa e ricerca
    providers.tsx
    globals.css
    dashboard/
      page.tsx                  # Dashboard utente (prenotazioni)
    host/
      dashboard/page.tsx        # Dashboard host (listing, guadagni)
      listing/
        new/page.tsx            # Creazione listing
        [id]/edit/page.tsx      # Modifica listing
    listing/
      [id]/page.tsx             # Dettaglio bagno
    booking/
      [id]/page.tsx             # Flusso prenotazione
      confirmation/page.tsx     # Conferma prenotazione
    auth/
      signin/page.tsx
      callback/route.ts
      signout/route.ts
    api/
      listings/route.ts         # CRUD listings
      bookings/route.ts         # Prenotazioni
      payments/
        webhook/route.ts        # Stripe webhooks
        connect/route.ts        # Onboarding host Stripe
      reviews/route.ts          # Recensioni
      identity/route.ts         # Stripe Identity
  components/
    ui/                         # shadcn/ui components
    map/                        # Mapbox components
    listing/                    # Card, form, gallery
    booking/                    # Flow prenotazione
    host/                       # Dashboard host
  lib/
    utils.ts
    prisma.ts
    stripe.ts                   # Stripe client singleton
    mapbox.ts                   # Mapbox utilities
    supabase/
      client.ts
      server.ts
      middleware.ts
  middleware.ts
prisma/
  schema.prisma                 # User, Listing, Booking, Review, Badge
```

### Development Environment

Next.js 15 con Turbopack per dev server rapido. Variabili d'ambiente gestite via `.env.local`.

**Required tools:** Node.js 20+, pnpm, Stripe CLI (per webhook locali), account Mapbox

### CI/CD & Deployment

**Build tool:** Next.js + Turbopack

**Pipeline:** GitHub Actions — lint, type-check, test, build

**Deployment:** Vercel (zero-config per Next.js, edge functions, preview deployments automatici)

**Target infrastructure:** Vercel + Supabase cloud + Stripe + Mapbox (tutti managed, zero ops)

### Architecture Decision Records (ADR)

| Decisione | Scelta | Rationale |
|---|---|---|
| Marketplace payments | Stripe Connect | Gestione automatica commissioni, onboarding host, compliance PCI |
| Mappe | Mapbox GL JS | Più flessibile di Google Maps per styling custom, pricing competitivo |
| Verifica identità | Stripe Identity | Integrazione nativa con Stripe esistente, evita un vendor aggiuntivo |
| Pattern architetturale | Monolite modulare | MVP velocity > scalabilità prematura |
| Deploy | Vercel | Zero config per Next.js, preview per ogni PR |

---

## Functional Requirements

### Autenticazione & Profili
*(Extends existing boilerplate: OAuth sign-in, session management, User model)*

- **FR1** — Login e registrazione tramite Google e GitHub OAuth *(boilerplate esistente)*
- **FR2** — Profilo utente con nome, foto, storico prenotazioni e recensioni ricevute
- **FR3** — Profilo host con tipo (Privato / Attività Commerciale), badge identificativo, stato verifica identità e valutazione media

### Listing & Disponibilità

- **FR4** — Creazione listing bagno con foto multiple (max 10, via Supabase Storage), descrizione, indirizzo, prezzo orario e indicazioni di accesso
- **FR5** — Gestione disponibilità: fasce orarie giornaliere attivabili/disattivabili dall'host con calendario settimanale
- **FR6** — Prenotazione con due modalità: istantanea (conferma automatica) o su richiesta (host approva manualmente entro 30 min)

### Mappa & Ricerca

- **FR7** — Mappa interattiva Mapbox con cluster di bagni disponibili in tempo reale, geolocalizzazione utente e ricerca per indirizzo
- **FR8** — Filtri di ricerca: prezzo (range), tipo host (Privato / Attività), accessibilità disabili, distanza, valutazione minima

### Pagamenti

- **FR9** — Pagamento sicuro via Stripe al momento della prenotazione con commissione 10% trattenuta automaticamente dalla piattaforma
- **FR10** — Stripe Connect per onboarding host: ogni host crea un account Stripe collegato e riceve i pagamenti direttamente
- **FR11** — Storico transazioni per host (guadagni netti, commissioni) e per utente (prenotazioni pagate)
- **FR12** — Policy di cancellazione: rimborso totale se la prenotazione viene cancellata prima della visita; rimborso parziale (50%) in caso di no-show dell'utente

### Verifica & Fiducia

- **FR13** — Verifica identità obbligatoria per host privati tramite documento d'identità (Stripe Identity); per attività commerciali verifica tramite P.IVA
- **FR14** — Recensioni bidirezionali post-visita: l'utente recensisce l'host (pulizia, accoglienza, precisione descrizione) e l'host recensisce l'utente (comportamento, puntualità)
- **FR15** — Sistema di badge: **Privato** 🏠, **Attività Commerciale** 🏪, **Verificato** ✅, **Super Host** ⭐ (assegnato automaticamente sopra soglia di qualità)

### Notifiche

- **FR16** — Notifiche email e push per: conferma prenotazione, pagamento ricevuto (host), promemoria pre-visita, richiesta recensione post-visita, nuova recensione ricevuta

---

## Non-Functional Requirements

### Security

- Verifica identità obbligatoria per tutti gli host prima di pubblicare un listing
- Indirizzo esatto del bagno visibile solo dopo conferma della prenotazione (pre-booking: solo zona/quartiere su mappa)
- Comunicazione host-utente mediata dalla piattaforma (no scambio diretto di contatti fino a prenotazione confermata)
- Dati di pagamento gestiti interamente da Stripe (PCI DSS compliance delegata)
- HTTPS obbligatorio, variabili d'ambiente per tutte le chiavi API

### Integrations

- **Stripe Connect** — marketplace payments e onboarding host
- **Stripe Identity** — verifica documenti host privati
- **Mapbox GL JS** — mappa interattiva, geocoding, routing
- **Supabase** — auth, database PostgreSQL, storage file (foto bagni)
- **Vercel** — hosting, edge functions, preview deployments

---

## Next Steps

1. **UX Design** — Definire flussi di interazione dettagliati e wireframe per le feature MVP (listing creation, booking flow, mappa)
2. **Architettura dettagliata** — Approfondire lo schema Prisma (Listing, Booking, Review, Badge) e il flusso Stripe Connect
3. **Backlog** — Decomporre i requisiti funzionali in epics e user stories con `/archetipo-spec`
4. **Validazione** — Review con stakeholder e test delle assunzioni di business più rischiose (densità host al lancio, willingness to pay)

---

_PRD generato via Archetipo Product Inception — 2026-05-06_
_Sessione condotta da: lorenzogiuntini@akeron.com con il team Archetipo_
