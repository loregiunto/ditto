import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const hosts = [
  {
    email: "giulia.rossi@mock.ditto.local",
    name: "Giulia Rossi",
    image: "https://i.pravatar.cc/150?img=47",
    identityStatus: "VERIFIED",
  },
  {
    email: "marco.bianchi@mock.ditto.local",
    name: "Marco Bianchi",
    image: "https://i.pravatar.cc/150?img=12",
    identityStatus: "VERIFIED",
  },
  {
    email: "bar.centrale@mock.ditto.local",
    name: "Bar Centrale Milano",
    image: "https://i.pravatar.cc/150?img=68",
    identityStatus: "VERIFIED",
  },
  {
    email: "sara.conti@mock.ditto.local",
    name: "Sara Conti",
    image: "https://i.pravatar.cc/150?img=32",
    identityStatus: null,
  },
  {
    email: "coworking.navigli@mock.ditto.local",
    name: "Coworking Navigli",
    image: "https://i.pravatar.cc/150?img=56",
    identityStatus: "VERIFIED",
  },
];

const photoPool = [
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
  "https://images.unsplash.com/photo-1564540583246-934409427776?w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
  "https://images.unsplash.com/photo-1552321554-5b2f6303a89e?w=1200&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
  "https://images.unsplash.com/photo-1631049035182-249067d7618e?w=1200&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1200&q=80",
  "https://images.unsplash.com/photo-1603825991742-ed42aaa9b9ee?w=1200&q=80",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
];

// Listings sparsi per Milano (diversi quartieri)
const listings = [
  {
    title: "Bagno accogliente in Brera",
    description:
      "Bagno appena ristrutturato in un appartamento privato nel cuore di Brera. Pulito, profumato, asciugamani e prodotti di cortesia inclusi. Ideale per una sosta veloce durante lo shopping.",
    hostEmail: "giulia.rossi@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Via Fiori Chiari 12, 20121 Milano MI",
    addressDisplay: "Brera, Milano",
    latitude: 45.4719,
    longitude: 9.1859,
    hourlyPriceCents: 500,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 4,
  },
  {
    title: "Toilette del Bar Centrale",
    description:
      "Toilette di un bar storico in zona Duomo. Sempre pulita, accessibile durante gli orari di apertura. Perfetta per turisti e lavoratori in giro per il centro.",
    hostEmail: "bar.centrale@mock.ditto.local",
    hostType: "BUSINESS",
    addressFull: "Corso Vittorio Emanuele II 24, 20122 Milano MI",
    addressDisplay: "Duomo, Milano",
    latitude: 45.4641,
    longitude: 9.1919,
    hourlyPriceCents: 200,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 3,
  },
  {
    title: "Bagno design ai Navigli",
    description:
      "Bagno moderno con doccia in loft sui Navigli. Disponibile per uso veloce o per rinfrescarsi dopo una giornata in giro. Wi-Fi disponibile.",
    hostEmail: "coworking.navigli@mock.ditto.local",
    hostType: "BUSINESS",
    addressFull: "Ripa di Porta Ticinese 61, 20143 Milano MI",
    addressDisplay: "Navigli, Milano",
    latitude: 45.4515,
    longitude: 9.1741,
    hourlyPriceCents: 800,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 5,
  },
  {
    title: "WC privato Porta Romana",
    description:
      "Piccolo bagno privato in monolocale. Accesso indipendente, codice fornito al momento della prenotazione. Tranquillo e discreto.",
    hostEmail: "marco.bianchi@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Viale Sabotino 19, 20135 Milano MI",
    addressDisplay: "Porta Romana, Milano",
    latitude: 45.4516,
    longitude: 9.1965,
    hourlyPriceCents: 400,
    bookingMode: "REQUEST",
    status: "ACTIVE",
    photoCount: 3,
  },
  {
    title: "Bagno con doccia Isola",
    description:
      "Bagno completo con doccia in zona Isola, vicino alla stazione Garibaldi. Perfetto per chi viaggia e ha bisogno di rinfrescarsi tra un treno e l'altro.",
    hostEmail: "sara.conti@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Via Carmagnola 4, 20159 Milano MI",
    addressDisplay: "Isola, Milano",
    latitude: 45.4859,
    longitude: 9.1894,
    hourlyPriceCents: 700,
    bookingMode: "REQUEST",
    status: "ACTIVE",
    photoCount: 4,
  },
  {
    title: "Toilette ristorante Città Studi",
    description:
      "Servizi di un ristorante in zona Politecnico. Disponibile a pranzo e cena durante apertura locale.",
    hostEmail: "bar.centrale@mock.ditto.local",
    hostType: "BUSINESS",
    addressFull: "Via Pacini 38, 20131 Milano MI",
    addressDisplay: "Città Studi, Milano",
    latitude: 45.4789,
    longitude: 9.2273,
    hourlyPriceCents: 300,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 2,
  },
  {
    title: "Bagno luminoso a Porta Venezia",
    description:
      "Bagno con finestra in appartamento condiviso. Ambiente caldo e curato, prodotti bio a disposizione.",
    hostEmail: "giulia.rossi@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Via Lazzaro Palazzi 8, 20124 Milano MI",
    addressDisplay: "Porta Venezia, Milano",
    latitude: 45.4769,
    longitude: 9.2058,
    hourlyPriceCents: 450,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 3,
  },
  {
    title: "Servizi coworking Lambrate",
    description:
      "Servizi igienici di uno spazio coworking aperto 9-19. Sempre puliti, accessibili durante orari ufficio.",
    hostEmail: "coworking.navigli@mock.ditto.local",
    hostType: "BUSINESS",
    addressFull: "Via Conte Rosso 22, 20134 Milano MI",
    addressDisplay: "Lambrate, Milano",
    latitude: 45.4839,
    longitude: 9.2410,
    hourlyPriceCents: 250,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 2,
  },
  {
    title: "Bagno familiare CityLife",
    description:
      "Bagno spazioso adatto anche a famiglie con bambini, fasciatoio disponibile. Vicino al parco di CityLife.",
    hostEmail: "sara.conti@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Piazza Tre Torri 1, 20145 Milano MI",
    addressDisplay: "CityLife, Milano",
    latitude: 45.4789,
    longitude: 9.1567,
    hourlyPriceCents: 600,
    bookingMode: "REQUEST",
    status: "ACTIVE",
    photoCount: 4,
  },
  {
    title: "WC Stazione Centrale",
    description:
      "Bagno in attività commerciale a 2 minuti dalla Stazione Centrale. Perfetto per un'emergenza durante il viaggio.",
    hostEmail: "bar.centrale@mock.ditto.local",
    hostType: "BUSINESS",
    addressFull: "Via Vittor Pisani 14, 20124 Milano MI",
    addressDisplay: "Stazione Centrale, Milano",
    latitude: 45.4847,
    longitude: 9.2032,
    hourlyPriceCents: 200,
    bookingMode: "INSTANT",
    status: "ACTIVE",
    photoCount: 2,
  },
  {
    title: "Bagno bozza (non pubblicato)",
    description: "Inserzione in bozza, non visibile pubblicamente.",
    hostEmail: "marco.bianchi@mock.ditto.local",
    hostType: "PRIVATE",
    addressFull: "Via Padova 100, 20127 Milano MI",
    addressDisplay: "Via Padova, Milano",
    latitude: 45.4945,
    longitude: 9.2287,
    hourlyPriceCents: 350,
    bookingMode: "INSTANT",
    status: "DRAFT",
    photoCount: 1,
  },
];

// Disponibilità: mix di pattern realistici
function buildAvailabilityRules(hostType, bookingMode) {
  // BUSINESS: Lun-Sab 9-19; PRIVATE: tutti i giorni 8-22 con pausa
  if (hostType === "BUSINESS") {
    return [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startMinute: 9 * 60,
      endMinute: 19 * 60,
    }));
  }
  return [0, 1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
    { dayOfWeek, startMinute: 8 * 60, endMinute: 13 * 60 },
    { dayOfWeek, startMinute: 15 * 60, endMinute: 22 * 60 },
  ]);
}

async function main() {
  console.log("→ Seeding mock users…");
  const userByEmail = new Map();
  for (const h of hosts) {
    const user = await prisma.user.upsert({
      where: { email: h.email },
      update: { name: h.name, image: h.image, identityStatus: h.identityStatus },
      create: {
        supabaseId: `mock-${randomUUID()}`,
        email: h.email,
        name: h.name,
        image: h.image,
        identityStatus: h.identityStatus,
      },
    });
    userByEmail.set(h.email, user);
  }
  console.log(`  ✓ ${userByEmail.size} utenti host`);

  console.log("→ Pulizia listing mock precedenti…");
  const hostIds = Array.from(userByEmail.values()).map((u) => u.id);
  const deleted = await prisma.listing.deleteMany({
    where: { hostId: { in: hostIds } },
  });
  console.log(`  ✓ rimossi ${deleted.count} listing precedenti`);

  console.log("→ Seeding listing…");
  let created = 0;
  for (const l of listings) {
    const host = userByEmail.get(l.hostEmail);
    if (!host) continue;
    const rules = buildAvailabilityRules(l.hostType, l.bookingMode);
    const photos = Array.from({ length: l.photoCount }, (_, i) => ({
      url: photoPool[(created + i) % photoPool.length],
      order: i,
    }));
    await prisma.listing.create({
      data: {
        hostId: host.id,
        title: l.title,
        description: l.description,
        hostType: l.hostType,
        addressFull: l.addressFull,
        addressDisplay: l.addressDisplay,
        latitude: l.latitude,
        longitude: l.longitude,
        hourlyPriceCents: l.hourlyPriceCents,
        bookingMode: l.bookingMode,
        status: l.status,
        photos: { create: photos },
        availabilityRules: { create: rules },
      },
    });
    created += 1;
  }
  console.log(`  ✓ ${created} listing creati`);

  console.log("\n✅ Seed completato.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
