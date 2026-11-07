// showbook/src/main.jsx
import { Component, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// showbook/src/App.jsx

// showbook/src/components/Home.jsx

// showbook/src/mockData.js
var img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
var hash = (s) => [...s].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
var genres = ["All", "Action", "Drama", "Comedy", "Sci-Fi", "Thriller"];
var m = (id, title, genre, rating, lang, duration, release, synopsis, cast) => ({
  id,
  title,
  genre,
  rating,
  lang,
  duration,
  release,
  synopsis,
  cast,
  poster: img(title.replace(/\s/g, ""), 400, 600),
  banner: img(title.replace(/\s/g, ""), 1200, 500)
});
var movies = [
  m(1, "Midnight Chase", "Action", 8.1, "English", "2h 15m", "12 Oct 2026", "A retired driver is pulled back for one last high-speed job across the city.", ["Ravi Kumar", "Anna Lee", "Tom Hardy"]),
  m(2, "Silent Waves", "Drama", 8.6, "Hindi", "2h 30m", "05 Oct 2026", "A fisherman\u2019s family faces choices when a storm changes their coastal village.", ["Meera Nair", "Arjun Rao", "Sita Devi"]),
  m(3, "Laugh Riot", "Comedy", 7.4, "Telugu", "2h 05m", "18 Oct 2026", "Three friends accidentally become wedding planners for the wrong family.", ["Karthik S", "Priya V", "Brahma Rao"]),
  m(4, "Orbit Zero", "Sci-Fi", 8.9, "English", "2h 40m", "20 Oct 2026", "A crew on a failing space station must decide who gets the last escape pod.", ["Mia Chen", "Luke Ford", "Ana Silva"]),
  m(5, "Shadow Files", "Thriller", 7.9, "Hindi", "2h 10m", "01 Oct 2026", "A journalist uncovers a conspiracy hidden inside city archives.", ["Neha Kapoor", "Vikram J", "Dev Anand"]),
  m(6, "Iron Dawn", "Action", 7.7, "Tamil", "2h 25m", "22 Oct 2026", "A soldier returns home to defend his town from a ruthless syndicate.", ["Surya K", "Anjali M", "Ravi T"]),
  m(7, "Paper Hearts", "Drama", 8.2, "English", "1h 55m", "10 Oct 2026", "Two strangers exchange letters after a mix-up at a post office.", ["Emma R", "Liam K", "Zoe P"]),
  m(8, "Galaxy Gang", "Sci-Fi", 7.2, "Telugu", "2h 00m", "15 Oct 2026", "A group of kids find an alien who needs help getting home.", ["Teja M", "Sai P", "Lakshmi N"])
];
var theaters = [
  { name: "PVR Cinemas: City Centre", times: ["10:00 AM", "01:30 PM", "04:45 PM", "08:00 PM"] },
  { name: "INOX: Grand Mall", times: ["11:15 AM", "02:30 PM", "07:00 PM", "10:15 PM"] },
  { name: "Cinepolis: Lake View", times: ["09:45 AM", "12:50 PM", "06:15 PM"] }
];
var rows = [
  ["A", "Silver", 150],
  ["B", "Silver", 150],
  ["C", "Silver", 150],
  ["D", "Gold", 250],
  ["E", "Gold", 250],
  ["F", "Gold", 250],
  ["G", "Platinum", 400],
  ["H", "Platinum", 400]
];
var seatsPerRow = 10;
var convenienceFee = 25;

// showbook/src/store.jsx

// showbook/src/utils.js
var CAPACITY = rows.length * seatsPerRow;
var TIER_OF = Object.fromEntries(rows.map(([r, tier]) => [r, tier]));
var DEFAULT_TIERS = Object.fromEntries(rows.map(([, tier, p]) => [tier, p]));
var ALL_SEATS = rows.flatMap(([r]) => Array.from({ length: seatsPerRow }, (_, i) => `${r}${i + 1}`));
var inr = (n) => `\u20B9${(Number(n) || 0).toLocaleString("en-IN")}`;
var pad = (n) => String(n).padStart(2, "0");
function getDates(count = 3) {
  return Array.from({ length: count }, (_, n) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + n);
    return {
      label: ["Today", "Tomorrow"][n] || "Day After",
      text: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    };
  });
}
function normTime(s) {
  const m2 = /^(\d{1,2}):([0-5]\d)\s*(am|pm)$/i.exec(String(s).trim());
  if (!m2 || +m2[1] < 1 || +m2[1] > 12) return null;
  return `${m2[1].padStart(2, "0")}:${m2[2]} ${m2[3].toUpperCase()}`;
}
function showStart(iso, time) {
  const m2 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || "");
  if (!iso || !m2) return null;
  let h = Number(m2[1]) % 12;
  if (m2[3].toUpperCase() === "PM") h += 12;
  const d = /* @__PURE__ */ new Date(`${iso}T00:00:00`);
  d.setHours(h, Number(m2[2]), 0, 0);
  return isNaN(d) ? null : d;
}
var showKey = (movieId, theater, iso, time) => [movieId, theater, iso, time].join("|");
var seatsTakenFor = (bookings, key) => new Set(bookings.filter((b) => b.status === "Confirmed" && b.key === key).flatMap((b) => b.seats.map((s) => s.id)));
var isPreSold = (movieId, show, id) => hash(`${movieId}${show.theater}${show.time}${show.date}${id}`) % 5 === 0;
var newBookingId = (taken) => {
  let id;
  do {
    id = "SB" + Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  } while (taken.has(id));
  return id;
};
function phase(b, now = /* @__PURE__ */ new Date()) {
  if (b.status === "Cancelled") return "Cancelled";
  const start = showStart(b.isoDate, b.time);
  return start && start <= now ? "Completed" : "Active";
}
function computeRefund(b, byAdmin = false, now = /* @__PURE__ */ new Date()) {
  if (byAdmin) return { amount: b.total, pct: 100, note: "Admin override: full refund including convenience fee." };
  const start = showStart(b.isoDate, b.time);
  const hrs = start ? (start - now) / 36e5 : 0;
  if (hrs >= 2) return { amount: b.subtotal, pct: 100, note: "Free cancellation (2+ hours before the show). Convenience fee is non-refundable." };
  if (hrs > 0) return { amount: Math.round(b.subtotal * 0.5), pct: 50, note: "Late cancellation (under 2 hours): 50% of ticket price refunded. Convenience fee is non-refundable." };
  return { amount: 0, pct: 0, note: "The show has already started: no refund." };
}
function movieStats(movie, theaters2, bookings) {
  const dates2 = getDates();
  let shows = 0, preSold = 0;
  for (const d of dates2) for (const t of theaters2) for (const time of t.times) {
    shows++;
    const show = { theater: t.name, time, date: `${d.label}, ${d.text}` };
    for (const id of ALL_SEATS) if (isPreSold(movie.id, show, id)) preSold++;
  }
  const mine = bookings.filter((b) => b.movieId === movie.id);
  const confirmed = mine.filter((b) => b.status === "Confirmed");
  const sold = confirmed.reduce((a, b) => a + b.seats.length, 0);
  const inWindow = confirmed.filter((b) => dates2.some((d) => d.iso === b.isoDate)).reduce((a, b) => a + b.seats.length, 0);
  const capacity = shows * CAPACITY;
  return {
    sold,
    revenue: mine.reduce((a, b) => a + b.total - (b.refund || 0), 0),
    // net of refunds
    shows,
    capacity,
    occupancy: capacity ? (preSold + inWindow) / capacity * 100 : 0
  };
}

// showbook/src/store.jsx
var KEY = "showbook:v1";
var Ctx = createContext(null);
var defaults = () => ({
  movies,
  theaters,
  pricing: { tiers: { ...DEFAULT_TIERS }, fee: convenienceFee },
  bookings: []
});
function load() {
  const base = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return base;
    return {
      movies: Array.isArray(raw.movies) ? raw.movies : base.movies,
      theaters: Array.isArray(raw.theaters) ? raw.theaters : base.theaters,
      pricing: { tiers: { ...base.pricing.tiers, ...raw.pricing?.tiers }, fee: Number(raw.pricing?.fee ?? base.pricing.fee) },
      bookings: Array.isArray(raw.bookings) ? raw.bookings : []
    };
  } catch {
    return base;
  }
}
function StoreProvider({ children }) {
  const [db, setDb] = useState(load);
  const ref = useRef(db);
  ref.current = db;
  useEffect(() => {
    try {
      const s = JSON.stringify(db);
      if (localStorage.getItem(KEY) !== s) localStorage.setItem(KEY, s);
    } catch {
    }
  }, [db]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY || e.key === null) {
        const next = load();
        ref.current = next;
        setDb(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const commit = (fn) => {
    const next = fn(ref.current);
    ref.current = next;
    setDb(next);
  };
  const addBooking = ({ movie, show, seats, fee, payment }) => {
    const cur = ref.current;
    if (!seats?.length) return { ok: false, error: "No seats selected." };
    const key = showKey(movie.id, show.theater, show.iso, show.time);
    const taken = seatsTakenFor(cur.bookings, key);
    const clash = seats.filter((s) => taken.has(s.id)).map((s) => s.id);
    if (clash.length) return { ok: false, error: `Seat ${clash.join(", ")} was just booked by someone else. Please choose different seats.` };
    const subtotal = seats.reduce((a, s) => a + s.price, 0);
    const booking = {
      id: newBookingId(new Set(cur.bookings.map((b) => b.id))),
      key,
      movieId: movie.id,
      movieTitle: movie.title,
      poster: movie.poster,
      theater: show.theater,
      date: show.date,
      isoDate: show.iso,
      time: show.time,
      seats,
      subtotal,
      fee,
      total: subtotal + fee,
      payment,
      status: "Confirmed",
      refund: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    commit((d) => ({ ...d, bookings: [booking, ...d.bookings] }));
    return { ok: true, booking };
  };
  const cancelBooking = (id, byAdmin = false) => {
    const b = ref.current.bookings.find((x) => x.id === id);
    if (!b || b.status !== "Confirmed") return { ok: false, error: "This booking is not active." };
    const start = showStart(b.isoDate, b.time);
    if (!byAdmin && !(start && start > /* @__PURE__ */ new Date())) return { ok: false, error: "This show has already started and cannot be cancelled." };
    const { amount } = computeRefund(b, byAdmin);
    commit((d) => ({
      ...d,
      bookings: d.bookings.map((x) => x.id === id ? { ...x, status: "Cancelled", refund: amount, cancelledAt: (/* @__PURE__ */ new Date()).toISOString(), cancelledBy: byAdmin ? "Admin" : "User" } : x)
    }));
    return { ok: true, refund: amount };
  };
  const restoreBooking = (id) => {
    const cur = ref.current;
    const b = cur.bookings.find((x) => x.id === id);
    if (!b || b.status !== "Cancelled") return { ok: false, error: "Booking is not cancelled." };
    const taken = seatsTakenFor(cur.bookings, b.key);
    const clash = b.seats.filter((s) => taken.has(s.id)).map((s) => s.id);
    if (clash.length) return { ok: false, error: `Seat ${clash.join(", ")} has been re-booked, cannot restore.` };
    commit((d) => ({
      ...d,
      bookings: d.bookings.map((x) => x.id === id ? { ...x, status: "Confirmed", refund: 0, cancelledAt: null, cancelledBy: null } : x)
    }));
    return { ok: true };
  };
  const saveMovie = (m2) => {
    const title = String(m2.title || "").trim();
    const rating = Number(m2.rating);
    if (!title) return { ok: false, error: "Title is required." };
    if (!(rating >= 0 && rating <= 10)) return { ok: false, error: "Rating must be between 0 and 10." };
    const seed = title.replace(/\s/g, "");
    const custom = String(m2.poster || "").trim();
    const clean = {
      ...m2,
      title,
      rating,
      genre: m2.genre || genres[1],
      lang: m2.lang || "English",
      duration: m2.duration || "2h 00m",
      release: m2.release || "",
      synopsis: m2.synopsis || "",
      cast: (m2.cast || []).filter(Boolean),
      poster: custom || img(seed, 400, 600),
      banner: custom || img(seed, 1200, 500)
    };
    commit((d) => {
      const exists = clean.id != null && d.movies.some((x) => x.id === clean.id);
      if (exists) return { ...d, movies: d.movies.map((x) => x.id === clean.id ? clean : x) };
      const id = Math.max(0, ...d.movies.map((x) => Number(x.id) || 0)) + 1;
      return { ...d, movies: [...d.movies, { ...clean, id }] };
    });
    return { ok: true };
  };
  const deleteMovie = (id) => {
    const cur = ref.current;
    if (cur.movies.length <= 1) return { ok: false, error: "At least one movie must remain." };
    if (cur.bookings.some((b) => b.movieId === id && b.status === "Confirmed"))
      return { ok: false, error: "This movie has active bookings. Cancel them first." };
    commit((d) => ({ ...d, movies: d.movies.filter((m2) => m2.id !== id) }));
    return { ok: true };
  };
  const saveTheaters = (theaters2) => commit((d) => ({ ...d, theaters: theaters2 }));
  const savePricing = (pricing) => commit((d) => ({ ...d, pricing }));
  const seedDemo = () => {
    const dates2 = getDates();
    let n = 0;
    for (let i = 0; i < 8; i++) {
      const { movies: movies2, theaters: theaters2, pricing, bookings } = ref.current;
      const movie = movies2[i % movies2.length], th = theaters2[i % theaters2.length];
      const time = th?.times?.[i % (th.times.length || 1)];
      if (!movie || !time) continue;
      const d = dates2[1 + i % 2];
      const show = { theater: th.name, time, date: `${d.label}, ${d.text}`, iso: d.iso };
      const taken = seatsTakenFor(bookings, showKey(movie.id, show.theater, show.iso, show.time));
      const seats = ALL_SEATS.filter((id) => !taken.has(id) && !isPreSold(movie.id, show, id)).slice(i * 3, i * 3 + 2 + i % 3).map((id) => ({ id, tier: TIER_OF[id[0]], price: pricing.tiers[TIER_OF[id[0]]] ?? 0 }));
      if (seats.length && addBooking({ movie, show, seats, fee: seats.length * pricing.fee, payment: { method: "Demo", detail: "Seeded" } }).ok) n++;
    }
    return n;
  };
  const resetAll = () => commit(() => defaults());
  const takenSeats = (key) => seatsTakenFor(db.bookings, key);
  return <Ctx.Provider value={{ ...db, takenSeats, addBooking, cancelBooking, restoreBooking, saveMovie, deleteMovie, saveTheaters, savePricing, seedDemo, resetAll }}>
      {children}
    </Ctx.Provider>;
}
var useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside <StoreProvider>");
  return v;
};

// showbook/src/components/Home.jsx
function Home({ onSelect }) {
  const { movies: movies2 } = useStore();
  const [q, setQ] = useState("");
  const [g, setG] = useState("All");
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 4e3);
    return () => clearInterval(t);
  }, []);
  const list = movies2.filter((m2) => (g === "All" || m2.genre === g) && m2.title.toLowerCase().includes(q.toLowerCase()));
  const h = movies2.length ? movies2[i % Math.min(4, movies2.length)] : null;
  return <div>
      {h && <div className="relative h-60 md:h-96 rounded-xl overflow-hidden mb-6">
        <img src={h.banner} alt={h.title} className="w-full h-full object-cover opacity-50" />
        <div className="absolute bottom-6 left-6">
          <p className="text-red-400 text-sm font-semibold">TRENDING NOW</p>
          <h2 className="text-3xl md:text-5xl font-bold">{h.title}</h2>
          <p className="text-gray-300">{h.genre} • {h.lang} • ★ {h.rating}</p>
          <button onClick={() => onSelect(h)} className="mt-3 bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold">Book Now</button>
        </div>
      </div>}

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
    value={q}
    onChange={(e) => setQ(e.target.value)}
    placeholder="Search movies..."
    className="flex-1 bg-[#181820] border border-white/10 rounded px-4 py-2 outline-none focus:border-red-500"
  />
        <div className="flex gap-2 flex-wrap">
          {genres.map((x) => <button
    key={x}
    onClick={() => setG(x)}
    className={`px-3 py-1 rounded-full text-sm border ${g === x ? "bg-red-600 border-red-600" : "border-white/20 text-gray-300"}`}
  >{x}</button>)}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Recommended Movies</h3>
      {list.length === 0 && <p className="text-gray-400">No movies found.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {list.map((m2) => <div key={m2.id} onClick={() => onSelect(m2)} className="cursor-pointer group">
            <img src={m2.poster} alt={m2.title} className="rounded-lg aspect-[2/3] object-cover w-full group-hover:scale-[1.03] transition" />
            <p className="font-semibold mt-2">{m2.title}</p>
            <p className="text-sm text-gray-400">{m2.genre} • {m2.lang}</p>
            <p className="text-sm text-yellow-400">★ {m2.rating}/10</p>
          </div>)}
      </div>
    </div>;
}

// showbook/src/components/MovieDetail.jsx
function MovieDetail({ movie: m2, onBack, onBook }) {
  return <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <div className="flex flex-col md:flex-row gap-8">
        <img src={m2.poster} alt={m2.title} className="w-64 rounded-xl self-center md:self-start" />
        <div>
          <h1 className="text-4xl font-bold">{m2.title}</h1>
          <p className="text-yellow-400 my-2">★ {m2.rating}/10</p>
          <div className="flex gap-2 text-sm my-3 flex-wrap">
            {[m2.genre, m2.lang, m2.duration, m2.release].filter(Boolean).map((t, i) => <span key={i} className="bg-white/10 px-3 py-1 rounded">{t}</span>)}
          </div>
          <h3 className="font-bold mt-4">About the movie</h3>
          <p className="text-gray-300">{m2.synopsis}</p>
          <h3 className="font-bold mt-4">Cast</h3>
          <div className="flex gap-4 mt-2">
            {(m2.cast || []).map((c) => <div key={c} className="text-center text-sm">
                <div className="w-14 h-14 rounded-full bg-red-600/30 flex items-center justify-center text-lg font-bold mx-auto">{c[0]}</div>
                <p className="mt-1 w-20">{c}</p>
              </div>)}
          </div>
          <button onClick={onBook} className="mt-8 bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-semibold">Book Tickets</button>
        </div>
      </div>
    </div>;
}

// showbook/src/components/Showtimes.jsx
var dates = getDates();
function Showtimes({ movie, onBack, onPick }) {
  const { theaters: theaters2 } = useStore();
  const [d, setD] = useState(0);
  const now = /* @__PURE__ */ new Date();
  return <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
      <div className="flex gap-3 mb-6">
        {dates.map((x, i) => <button
    key={i}
    onClick={() => setD(i)}
    className={`px-5 py-2 rounded-lg text-center ${d === i ? "bg-red-600" : "bg-[#181820] border border-white/10"}`}
  >
            <div className="text-xs">{x.label}</div><div className="font-bold">{x.text}</div>
          </button>)}
      </div>
      {theaters2.length === 0 && <p className="text-gray-400">No theaters are scheduled right now.</p>}
      {theaters2.map((t) => <div key={t.name} className="bg-[#181820] rounded-lg p-4 mb-4">
          <p className="font-semibold mb-3">{t.name}</p>
          <div className="flex gap-3 flex-wrap">
            {t.times.map((time) => {
    const start = showStart(dates[d].iso, time);
    const past = start && start <= now;
    return <button
      key={time}
      disabled={past}
      title={past ? "Show already started" : ""}
      onClick={() => onPick({ date: `${dates[d].label}, ${dates[d].text}`, iso: dates[d].iso, theater: t.name, time })}
      className={`px-4 py-1 rounded text-sm border ${past ? "border-gray-700 text-gray-600 cursor-not-allowed line-through" : "border-green-500 text-green-400 hover:bg-green-500 hover:text-black"}`}
    >{time}</button>;
  })}
          </div>
        </div>)}
    </div>;
}

// showbook/src/components/SeatPicker.jsx
var MAX = 8;
function SeatPicker({ movie, show, onBack, onCheckout }) {
  const { pricing, takenSeats } = useStore();
  const [sel, setSel] = useState([]);
  const booked = takenSeats(showKey(movie.id, show.theater, show.iso, show.time));
  const isBooked = (id) => booked.has(id);
  const isSold = (id) => isBooked(id) || isPreSold(movie.id, show, id);
  const priceOf = (id) => pricing.tiers[TIER_OF[id[0]]] ?? 0;
  const chosen = sel.filter((id) => !isSold(id));
  const toggle = (id) => {
    if (isSold(id)) return;
    setSel(() => chosen.includes(id) ? chosen.filter((x) => x !== id) : chosen.length < MAX ? [...chosen, id] : chosen);
  };
  const subtotal = chosen.reduce((a, id) => a + priceOf(id), 0);
  return <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold">{movie.title}</h2>
      <p className="text-gray-400 mb-6">{show.theater} • {show.date} • {show.time}</p>

      <div className="overflow-x-auto">
        <div className="min-w-[420px] mx-auto w-fit">
          {rows.map(([r, cat], idx) => <div key={r}>
              {(idx === 0 || rows[idx - 1][1] !== cat) && <p className="text-xs text-gray-400 mt-4 mb-1">{cat.toUpperCase()} – {inr(pricing.tiers[cat])}</p>}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-5 text-sm text-gray-400">{r}</span>
                {Array.from({ length: seatsPerRow }, (_, n) => {
    const id = `${r}${n + 1}`;
    const sold = isSold(id), on = chosen.includes(id);
    return <button
      key={id}
      disabled={sold}
      onClick={() => toggle(id)}
      title={isBooked(id) ? `${id} (booked)` : id}
      className={`w-8 h-8 text-xs rounded-t-md border ${n === 4 ? "mr-6" : ""} ${sold ? "bg-gray-700 border-gray-700 text-gray-500 cursor-not-allowed" : on ? "bg-green-500 border-green-500 text-black" : "border-green-500 text-green-400 hover:bg-green-500/20"}`}
    >{n + 1}</button>;
  })}
              </div>
            </div>)}
          <div className="mt-8 h-2 bg-gradient-to-b from-red-500/70 to-transparent rounded-full" />
          <p className="text-center text-xs text-gray-400 mt-1">ALL EYES THIS WAY — SCREEN</p>
        </div>
      </div>

      <div className="flex gap-5 justify-center text-xs mt-6 text-gray-300">
        <span><i className="inline-block w-3 h-3 border border-green-500 mr-1" />Available</span>
        <span><i className="inline-block w-3 h-3 bg-green-500 mr-1" />Selected</span>
        <span><i className="inline-block w-3 h-3 bg-gray-700 mr-1" />Sold out</span>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#181820] border-t border-white/10 p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-400">{chosen.length ? chosen.join(", ") : `Select seats (max ${MAX})`}</p>
          <p className="font-bold text-lg">{inr(subtotal)}</p>
        </div>
        <button
    disabled={!chosen.length}
    onClick={() => onCheckout({
      seats: chosen.map((id) => ({ id, tier: TIER_OF[id[0]], price: priceOf(id) })),
      subtotal,
      fee: chosen.length * pricing.fee
    })}
    className="bg-red-600 disabled:bg-gray-600 px-8 py-3 rounded font-semibold"
  >Proceed</button>
      </div>
      <div className="h-24" />
    </div>;
}

// showbook/src/components/Checkout.jsx

// showbook/src/components/Ticket.jsx
function QR({ seed }) {
  const n = 13, h = hash(seed);
  return <div className="grid gap-px bg-white p-2 w-32 h-32 mx-auto" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n * n }, (_, i) => {
    const corner = (i % n < 3 || i % n > n - 4) && (Math.floor(i / n) < 3 || Math.floor(i / n) > n - 4 && i % n < 3);
    const on = corner || hash(seed + i + h) % 2 === 0;
    return <div key={i} className={on ? "bg-black" : "bg-white"} />;
  })}
    </div>;
}
function Ticket({ booking: b }) {
  const cancelled = b.status === "Cancelled";
  return <div id="ticket-print" className="bg-white text-black rounded-lg p-5 relative overflow-hidden">
      {cancelled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="border-4 border-red-600 text-red-600 text-3xl font-extrabold px-4 py-1 -rotate-12 bg-white/70">CANCELLED</span>
        </div>}
      <h4 className="text-lg font-bold">{b.movieTitle}</h4>
      <p className="text-sm text-gray-600">{b.theater}</p>
      <p className="text-sm">{b.date} • {b.time}</p>
      <p className="text-sm font-semibold mt-2">
        Seats: {b.seats.map((s) => s.id).join(", ")} <span className="font-normal text-gray-500">({b.seats.length} ticket{b.seats.length > 1 ? "s" : ""})</span>
      </p>
      <p className="text-sm">Paid: <b>{inr(b.total)}</b> <span className="text-gray-500">via {b.payment?.method} {b.payment?.detail}</span></p>
      {cancelled && <p className="text-sm text-red-600">Refunded: {inr(b.refund)}</p>}
      <div className="border-t border-dashed border-gray-400 my-3" />
      <QR seed={b.id} />
      <p className="text-center text-sm mt-2 font-mono font-semibold tracking-wider">{b.id}</p>
      <p className="text-center text-[11px] text-gray-500">Booked on {new Date(b.createdAt).toLocaleString("en-IN")}</p>
    </div>;
}

// showbook/src/components/ui.jsx
var inputCls = "w-full bg-[#0f0f14] border border-white/15 rounded px-3 py-2 outline-none focus:border-red-500 text-sm";
function Modal({ children, onClose, wide }) {
  useEffect(() => {
    if (!onClose) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return <div
    className="modal-backdrop fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30"
    onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
  >
      <div className={`bg-[#181820] rounded-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[92vh] overflow-y-auto p-6`}>
        {children}
      </div>
    </div>;
}
function ConfirmModal({ title, children, confirmLabel = "Confirm", cancelLabel = "Go back", danger, onConfirm, onCancel }) {
  return <Modal onClose={onCancel}>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <div className="text-sm text-gray-300 space-y-2">{children}</div>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="flex-1 border border-white/20 py-2 rounded">{cancelLabel}</button>
        <button
    onClick={onConfirm}
    className={`flex-1 py-2 rounded font-semibold ${danger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
  >
          {confirmLabel}
        </button>
      </div>
    </Modal>;
}
var BADGE = {
  Active: "bg-green-500/20 text-green-400",
  Completed: "bg-sky-500/20 text-sky-300",
  Cancelled: "bg-red-500/20 text-red-400"
};
var StatusBadge = ({ status }) => <span className={`text-xs font-semibold px-2 py-0.5 rounded ${BADGE[status] || "bg-white/10"}`}>{status}</span>;
function Field({ label, error, children }) {
  return <label className="block text-sm">
      <span className="text-gray-400">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </label>;
}
var Notice = ({ ok, children, onClose }) => <div className={`flex justify-between items-start gap-3 text-sm rounded px-4 py-3 mb-4 ${ok ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
    <span>{children}</span>
    {onClose && <button onClick={onClose} aria-label="Dismiss">✕</button>}
  </div>;

// showbook/src/components/Checkout.jsx
var BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"];
var METHODS = [["card", "Credit / Debit Card"], ["upi", "UPI"], ["netbanking", "Net Banking"]];
function validate(method, f) {
  const e = {};
  if (method === "card") {
    if (f.name.trim().length < 2) e.name = "Enter the name on the card";
    if (f.number.replace(/\D/g, "").length !== 16) e.number = "Card number must be 16 digits";
    const m2 = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(f.expiry);
    if (!m2) e.expiry = "Use MM/YY";
    else if (new Date(2e3 + Number(m2[2]), Number(m2[1]), 1) <= /* @__PURE__ */ new Date()) e.expiry = "Card has expired";
    if (!/^\d{3}$/.test(f.cvv)) e.cvv = "3-digit CVV";
  } else if (method === "upi") {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) e.upi = "Enter a valid UPI ID, e.g. name@okbank";
  } else if (!f.bank) e.bank = "Please select a bank";
  return e;
}
function Checkout({ movie, show, order, onClose, onDone, onViewBookings }) {
  const { addBooking } = useStore();
  const [method, setMethod] = useState("card");
  const [f, setF] = useState({ name: "", number: "", expiry: "", cvv: "", upi: "", bank: "" });
  const [errors, setErrors] = useState({});
  const [phase2, setPhase] = useState("form");
  const [booking, setBooking] = useState(null);
  const [serverError, setServerError] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!order?.seats?.length) return null;
  const total = order.subtotal + order.fee;
  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: void 0 }));
  };
  const groups = Object.values(order.seats.reduce((a, s) => {
    (a[s.tier] ||= { tier: s.tier, price: s.price, ids: [] }).ids.push(s.id);
    return a;
  }, {}));
  const pay = () => {
    if (phase2 !== "form") return;
    const e = validate(method, f);
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) return;
    const payment = method === "card" ? { method: "Card", detail: `\u2022\u2022\u2022\u2022 ${f.number.replace(/\D/g, "").slice(-4)}` } : method === "upi" ? { method: "UPI", detail: f.upi.trim() } : { method: "Net Banking", detail: f.bank };
    setPhase("processing");
    timer.current = setTimeout(() => {
      const res = addBooking({ movie, show, seats: order.seats, fee: order.fee, payment });
      if (res.ok) {
        setBooking(res.booking);
        setPhase("done");
      } else {
        setServerError(res.error);
        setPhase("form");
      }
    }, 1200);
  };
  if (phase2 === "done") return <Modal>
      <p className="text-green-400 text-center font-semibold mb-3">✓ Booking Confirmed</p>
      <Ticket booking={booking} />
      <div className="flex gap-2 mt-4 no-print">
        <button onClick={() => window.print()} className="flex-1 border border-white/20 py-2 rounded text-sm">Print / Save PDF</button>
        <button onClick={onViewBookings} className="flex-1 border border-white/20 py-2 rounded text-sm">My Bookings</button>
      </div>
      <button onClick={onDone} className="w-full mt-3 bg-red-600 py-2 rounded font-semibold no-print">Back to Home</button>
    </Modal>;
  const busy = phase2 === "processing";
  return <Modal>
      <h3 className="text-xl font-bold mb-1">Checkout</h3>
      <p className="text-sm text-gray-400 mb-4">{movie.title} • {show.theater} • {show.date}, {show.time}</p>

      <div className="space-y-1.5 text-sm bg-black/20 rounded p-3">
        {groups.map((g) => <div key={g.tier} className="flex justify-between gap-3">
            <span className="text-gray-300">{g.tier} × {g.ids.length} <span className="text-gray-500">({g.ids.join(", ")})</span></span>
            <span>{inr(g.price * g.ids.length)}</span>
          </div>)}
        <div className="flex justify-between"><span className="text-gray-400">Convenience fee ({order.seats.length} × {inr(order.fee / order.seats.length)})</span><span>{inr(order.fee)}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2"><span>Total</span><span>{inr(total)}</span></div>
      </div>

      <div className="flex gap-2 mt-5 mb-4 flex-wrap">
        {METHODS.map(([id, label]) => <button
    key={id}
    disabled={busy}
    onClick={() => {
      setMethod(id);
      setErrors({});
    }}
    className={`px-3 py-1.5 rounded-full text-sm border ${method === id ? "bg-red-600 border-red-600" : "border-white/20 text-gray-300"}`}
  >{label}</button>)}
      </div>

      <div className="space-y-3">
        {method === "card" && <>
          <Field label="Name on card" error={errors.name}>
            <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="A. Student" /></Field>
          <Field label="Card number" error={errors.number}>
            <input
    className={inputCls}
    inputMode="numeric"
    placeholder="4242 4242 4242 4242"
    value={f.number}
    onChange={(e) => set("number", e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))}
  /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry (MM/YY)" error={errors.expiry}>
              <input
    className={inputCls}
    inputMode="numeric"
    placeholder="12/29"
    value={f.expiry}
    onChange={(e) => set("expiry", e.target.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2"))}
  /></Field>
            <Field label="CVV" error={errors.cvv}>
              <input
    className={inputCls}
    type="password"
    inputMode="numeric"
    placeholder="•••"
    value={f.cvv}
    onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
  /></Field>
          </div>
        </>}
        {method === "upi" && <Field label="UPI ID" error={errors.upi}>
            <input className={inputCls} placeholder="name@okbank" value={f.upi} onChange={(e) => set("upi", e.target.value)} /></Field>}
        {method === "netbanking" && <Field label="Select your bank" error={errors.bank}>
            <select className={inputCls} value={f.bank} onChange={(e) => set("bank", e.target.value)}>
              <option value="">-- choose bank --</option>
              {BANKS.map((b) => <option key={b}>{b}</option>)}
            </select></Field>}
      </div>

      {serverError && <p className="text-red-400 text-sm mt-4">{serverError}</p>}
      <p className="text-xs text-gray-500 mt-3">Demo only: no real payment is made and card details are never stored.</p>

      <div className="flex gap-3 mt-5">
        <button onClick={onClose} disabled={busy} className="flex-1 border border-white/20 py-2 rounded disabled:opacity-40">
          {serverError ? "Change seats" : "Cancel"}</button>
        <button onClick={pay} disabled={busy} className="flex-1 bg-red-600 disabled:bg-gray-600 py-2 rounded font-semibold">
          {busy ? "Processing\u2026" : `Pay ${inr(total)}`}</button>
      </div>
    </Modal>;
}

// showbook/src/components/MyBookings.jsx
var FILTERS = ["All", "Active", "Completed", "Cancelled"];
function MyBookings({ onHome }) {
  const { bookings, cancelBooking } = useStore();
  const [filter, setFilter] = useState("All");
  const [viewId, setViewId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [notice, setNotice] = useState(null);
  const viewing = bookings.find((b) => b.id === viewId);
  const cancelling = bookings.find((b) => b.id === cancelId);
  const list = bookings.filter((b) => filter === "All" || phase(b) === filter);
  const doCancel = () => {
    const res = cancelBooking(cancelId);
    setNotice(res.ok ? { ok: true, text: `Booking ${cancelId} cancelled. ${inr(res.refund)} will be refunded to your original payment method.` } : { ok: false, text: res.error });
    setCancelId(null);
  };
  return <div>
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      {notice && <Notice ok={notice.ok} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((x) => <button
    key={x}
    onClick={() => setFilter(x)}
    className={`px-3 py-1 rounded-full text-sm border ${filter === x ? "bg-red-600 border-red-600" : "border-white/20 text-gray-300"}`}
  >
            {x} {x === "All" ? `(${bookings.length})` : `(${bookings.filter((b) => phase(b) === x).length})`}
          </button>)}
      </div>

      {list.length === 0 && <div className="text-center text-gray-400 py-16">
          <p className="mb-4">{bookings.length ? `No ${filter.toLowerCase()} bookings.` : "You have not booked any tickets yet."}</p>
          <button onClick={onHome} className="bg-red-600 px-6 py-2 rounded font-semibold text-white">Browse movies</button>
        </div>}

      <div className="space-y-4">
        {list.map((b) => {
    const st = phase(b);
    return <div key={b.id} className="bg-[#181820] rounded-lg p-4 flex gap-4">
              <img src={b.poster} alt="" className="w-20 h-28 object-cover rounded hidden sm:block bg-white/5" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-start">
                  <h3 className="font-bold text-lg truncate">{b.movieTitle}</h3>
                  <StatusBadge status={st} />
                </div>
                <p className="text-sm text-gray-400">{b.theater}</p>
                <p className="text-sm">{b.date} • {b.time}</p>
                <p className="text-sm mt-1">Seats: <b>{b.seats.map((s) => s.id).join(", ")}</b></p>
                <p className="text-sm text-gray-400">
                  {inr(b.total)} • <span className="font-mono">{b.id}</span>
                  {st === "Cancelled" && <span className="text-red-400"> • Refunded {inr(b.refund)}{b.cancelledBy === "Admin" ? " (by admin)" : ""}</span>}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setViewId(b.id)} className="border border-white/20 px-3 py-1 rounded text-sm">View ticket</button>
                  {st === "Active" && <button onClick={() => setCancelId(b.id)} className="border border-red-500 text-red-400 hover:bg-red-500/10 px-3 py-1 rounded text-sm">Cancel booking</button>}
                </div>
              </div>
            </div>;
  })}
      </div>

      {viewing && <Modal onClose={() => setViewId(null)}>
          <Ticket booking={viewing} />
          <div className="flex gap-3 mt-4 no-print">
            <button onClick={() => window.print()} className="flex-1 border border-white/20 py-2 rounded text-sm">Print / Save PDF</button>
            <button onClick={() => setViewId(null)} className="flex-1 bg-red-600 py-2 rounded font-semibold text-sm">Close</button>
          </div>
        </Modal>}

      {cancelling && (() => {
    const r = computeRefund(cancelling);
    return <ConfirmModal
      title="Cancel this booking?"
      danger
      confirmLabel="Yes, cancel"
      cancelLabel="Keep booking"
      onConfirm={doCancel}
      onCancel={() => setCancelId(null)}
    >
            <p><b>{cancelling.movieTitle}</b> • {cancelling.date}, {cancelling.time}</p>
            <p>Seats: {cancelling.seats.map((s) => s.id).join(", ")} (will be released)</p>
            <div className="bg-black/20 rounded p-3 space-y-1">
              <div className="flex justify-between"><span>Amount paid</span><span>{inr(cancelling.total)}</span></div>
              <div className="flex justify-between text-gray-400"><span>Non-refundable</span><span>− {inr(cancelling.total - r.amount)}</span></div>
              <div className="flex justify-between font-bold text-green-400 border-t border-white/10 pt-1"><span>Refund ({r.pct}% of tickets)</span><span>{inr(r.amount)}</span></div>
            </div>
            <p className="text-xs text-gray-400">{r.note}</p>
          </ConfirmModal>;
  })()}
    </div>;
}

// showbook/src/components/admin/AdminDashboard.jsx

// showbook/src/components/admin/Analytics.jsx
var Stat = ({ label, value, sub }) => <div className="bg-[#181820] rounded-lg p-4">
    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>;
function Analytics() {
  const { movies: movies2, theaters: theaters2, bookings } = useStore();
  const confirmed = bookings.filter((b) => b.status === "Confirmed");
  const cancelled = bookings.filter((b) => b.status === "Cancelled");
  const tickets = confirmed.reduce((a, b) => a + b.seats.length, 0);
  const gross = confirmed.reduce((a, b) => a + b.total, 0);
  const retained = cancelled.reduce((a, b) => a + b.total - (b.refund || 0), 0);
  const refunds = cancelled.reduce((a, b) => a + (b.refund || 0), 0);
  const stats = useMemo(
    () => movies2.map((m2) => ({ m: m2, ...movieStats(m2, theaters2, bookings) })).sort((a, b) => b.revenue - a.revenue),
    [movies2, theaters2, bookings]
  );
  const maxRev = Math.max(1, ...stats.map((s) => s.revenue));
  return <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tickets sold" value={tickets} sub={`${confirmed.length} active bookings`} />
        <Stat label="Net revenue" value={inr(gross + retained)} sub={`Gross ${inr(gross)} + ${inr(retained)} retained`} />
        <Stat label="Cancellations" value={cancelled.length} sub={`${inr(refunds)} refunded`} />
        <Stat label="Avg. order value" value={inr(confirmed.length ? Math.round(gross / confirmed.length) : 0)} />
      </div>

      <div className="bg-[#181820] rounded-lg p-4 overflow-x-auto">
        <h3 className="font-bold mb-3">Performance by movie</h3>
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-gray-400 text-xs uppercase">
            <tr><th className="py-2">Movie</th><th>Tickets</th><th className="w-1/3">Net revenue</th><th className="w-1/4">Occupancy</th></tr>
          </thead>
          <tbody>
            {stats.map((s) => <tr key={s.m.id} className="border-t border-white/10">
                <td className="py-2 font-semibold">{s.m.title}</td>
                <td>{s.sold}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-white/10 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${s.revenue / maxRev * 100}%` }} /></div>
                    <span className="w-20 text-right">{inr(s.revenue)}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-white/10 rounded"><div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, s.occupancy)}%` }} /></div>
                    <span className="w-12 text-right">{s.occupancy.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>)}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-3">
          Occupancy = (pre-sold box-office seats + online bookings) ÷ total seats across all scheduled shows in the next 3 days.
        </p>
      </div>
    </div>;
}

// showbook/src/components/admin/BookingsManager.jsx
function BookingsManager() {
  const { bookings, cancelBooking, restoreBooking } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [target, setTarget] = useState(null);
  const [notice, setNotice] = useState(null);
  const needle = q.trim().toLowerCase();
  const list = bookings.filter((b) => (status === "All" || phase(b) === status) && (!needle || `${b.id} ${b.movieTitle} ${b.theater}`.toLowerCase().includes(needle)));
  const doCancel = () => {
    const res = cancelBooking(target.id, true);
    setNotice(res.ok ? { ok: true, text: `Booking ${target.id} cancelled. ${inr(res.refund)} refunded in full.` } : { ok: false, text: res.error });
    setTarget(null);
  };
  const doRestore = (id) => {
    const res = restoreBooking(id);
    setNotice(res.ok ? { ok: true, text: `Booking ${id} restored.` } : { ok: false, text: res.error });
  };
  return <div>
      {notice && <Notice ok={notice.ok} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input className={`${inputCls} flex-1 min-w-[200px]`} placeholder="Search booking ID, movie, theater…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "Active", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {list.length === 0 ? <p className="text-gray-400 text-center py-12">{bookings.length ? "No bookings match." : "No bookings yet. Make one as a user, or use \u201CLoad demo bookings\u201D."}</p> : <div className="bg-[#181820] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-gray-400 text-xs uppercase">
              <tr><th className="p-3">ID</th><th>Movie / show</th><th>Seats</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {list.map((b) => {
    const st = phase(b);
    return <tr key={b.id} className="border-t border-white/10 align-top">
                    <td className="p-3 font-mono text-xs">{b.id}</td>
                    <td><p className="font-semibold">{b.movieTitle}</p><p className="text-xs text-gray-400">{b.theater} • {b.date}, {b.time}</p></td>
                    <td>{b.seats.map((s) => s.id).join(", ")}</td>
                    <td>{inr(b.total)}{st === "Cancelled" && <p className="text-xs text-red-400">refund {inr(b.refund)}</p>}</td>
                    <td className="text-xs text-gray-400">{b.payment?.method}<br />{b.payment?.detail}</td>
                    <td><StatusBadge status={st} />{b.cancelledBy && <p className="text-xs text-gray-500 mt-1">by {b.cancelledBy}</p>}</td>
                    <td className="pr-3 text-right whitespace-nowrap">
                      {b.status === "Confirmed" && <button onClick={() => setTarget(b)} className="border border-red-500 text-red-400 px-3 py-1 rounded text-xs">Cancel</button>}
                      {b.status === "Cancelled" && <button onClick={() => doRestore(b.id)} className="border border-white/20 px-3 py-1 rounded text-xs">Restore</button>}
                    </td>
                  </tr>;
  })}
            </tbody>
          </table>
        </div>}

      {target && <ConfirmModal title="Cancel booking (admin override)?" danger confirmLabel="Cancel & refund" cancelLabel="Go back" onConfirm={doCancel} onCancel={() => setTarget(null)}>
          <p><b>{target.movieTitle}</b> • {target.date}, {target.time}</p>
          <p>Seats {target.seats.map((s) => s.id).join(", ")} will be released.</p>
          <p className="text-green-400 font-semibold">Full refund: {inr(target.total)} (includes convenience fee)</p>
        </ConfirmModal>}
    </div>;
}

// showbook/src/components/admin/MovieManager.jsx
var EMPTY = { title: "", genre: "Action", lang: "English", duration: "2h 00m", release: "", rating: "7.5", synopsis: "", cast: "", poster: "" };
function MovieManager() {
  const { movies: movies2, saveMovie, deleteMovie } = useStore();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState(null);
  const open = (m2) => {
    setError("");
    setDraft(m2 ? { ...m2, cast: (m2.cast || []).join(", "), poster: m2.poster?.includes("picsum.photos") ? "" : m2.poster } : EMPTY);
  };
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const res = saveMovie({ ...draft, cast: draft.cast.split(",").map((s) => s.trim()) });
    if (!res.ok) return setError(res.error);
    setNotice({ ok: true, text: `Saved "${draft.title.trim()}".` });
    setDraft(null);
  };
  const confirmDelete = () => {
    const res = deleteMovie(toDelete.id);
    setNotice(res.ok ? { ok: true, text: `Deleted "${toDelete.title}".` } : { ok: false, text: res.error });
    setToDelete(null);
  };
  return <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Movies ({movies2.length})</h3>
        <button onClick={() => open(null)} className="bg-red-600 px-4 py-1.5 rounded text-sm font-semibold">+ Add movie</button>
      </div>
      {notice && <Notice ok={notice.ok} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div className="bg-[#181820] rounded-lg divide-y divide-white/10">
        {movies2.map((m2) => <div key={m2.id} className="flex items-center gap-3 p-3">
            <img src={m2.poster} alt="" className="w-10 h-14 object-cover rounded bg-white/5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{m2.title}</p>
              <p className="text-xs text-gray-400">{m2.genre} • {m2.lang} • {m2.duration} • ★ {m2.rating}</p>
            </div>
            <button onClick={() => open(m2)} className="border border-white/20 px-3 py-1 rounded text-sm">Edit</button>
            <button onClick={() => setToDelete(m2)} className="border border-red-500 text-red-400 px-3 py-1 rounded text-sm">Delete</button>
          </div>)}
      </div>

      {draft && <Modal wide>
          <form onSubmit={submit} className="space-y-3">
            <h3 className="text-xl font-bold">{draft.id ? "Edit movie" : "Add movie"}</h3>
            <Field label="Title *"><input className={inputCls} value={draft.title} onChange={(e) => set("title", e.target.value)} autoFocus /></Field>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Genre">
                <select className={inputCls} value={draft.genre} onChange={(e) => set("genre", e.target.value)}>
                  {genres.filter((g) => g !== "All").map((g) => <option key={g}>{g}</option>)}
                </select></Field>
              <Field label="Language"><input className={inputCls} value={draft.lang} onChange={(e) => set("lang", e.target.value)} /></Field>
              <Field label="Duration"><input className={inputCls} value={draft.duration} onChange={(e) => set("duration", e.target.value)} /></Field>
              <Field label="Rating (0-10)"><input className={inputCls} type="number" step="0.1" min="0" max="10" value={draft.rating} onChange={(e) => set("rating", e.target.value)} /></Field>
            </div>
            <Field label="Release date"><input className={inputCls} placeholder="12 Nov 2026" value={draft.release} onChange={(e) => set("release", e.target.value)} /></Field>
            <Field label="Synopsis"><textarea rows={3} className={inputCls} value={draft.synopsis} onChange={(e) => set("synopsis", e.target.value)} /></Field>
            <Field label="Cast (comma separated)"><input className={inputCls} value={draft.cast} onChange={(e) => set("cast", e.target.value)} /></Field>
            <Field label="Poster image URL (optional)"><input className={inputCls} placeholder="https://…" value={draft.poster} onChange={(e) => set("poster", e.target.value)} /></Field>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setDraft(null)} className="flex-1 border border-white/20 py-2 rounded">Cancel</button>
              <button className="flex-1 bg-red-600 py-2 rounded font-semibold">Save movie</button>
            </div>
          </form>
        </Modal>}

      {toDelete && <ConfirmModal title={`Delete "${toDelete.title}"?`} danger confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
          <p>The movie will disappear from the home page. Past bookings stay in history.</p>
        </ConfirmModal>}
    </div>;
}

// showbook/src/components/admin/ShowsPricing.jsx
function ShowsPricing() {
  const { pricing, theaters: theaters2, savePricing, saveTheaters } = useStore();
  const [tiers, setTiers] = useState(() => ({ ...pricing.tiers }));
  const [fee, setFee] = useState(String(pricing.fee));
  const [rowsDraft, setRowsDraft] = useState(() => theaters2.map((t) => ({ name: t.name, times: t.times.join(", ") })));
  const [notice, setNotice] = useState(null);
  const isMoney = (v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;
  const savePrices = () => {
    if (![...Object.values(tiers), fee].every(isMoney)) return setNotice({ ok: false, text: "Prices must be numbers \u2265 0." });
    savePricing({
      tiers: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, Math.round(Number(v))])),
      fee: Math.round(Number(fee))
    });
    setNotice({ ok: true, text: "Pricing updated. New bookings use these prices; existing bookings keep theirs." });
  };
  const saveShows = () => {
    const names = rowsDraft.map((r) => r.name.trim());
    if (!rowsDraft.length) return setNotice({ ok: false, text: "Keep at least one theater." });
    if (names.some((n) => !n)) return setNotice({ ok: false, text: "Every theater needs a name." });
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return setNotice({ ok: false, text: "Theater names must be unique." });
    const out = [];
    for (const [i, r] of rowsDraft.entries()) {
      const parts = r.times.split(",").map((s) => s.trim()).filter(Boolean);
      const times = parts.map(normTime);
      if (!parts.length || times.includes(null))
        return setNotice({ ok: false, text: `"${names[i]}": use times like 10:00 AM, 06:30 PM (comma separated).` });
      out.push({ name: names[i], times: [...new Set(times)].sort((a, b) => toMin(a) - toMin(b)) });
    }
    saveTheaters(out);
    setNotice({ ok: true, text: "Showtimes updated." });
  };
  const upd = (i, k, v) => setRowsDraft((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  return <div className="space-y-6">
      {notice && <Notice ok={notice.ok} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <section className="bg-[#181820] rounded-lg p-4">
        <h3 className="font-bold mb-3">Ticket pricing (₹)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(tiers).map((t) => <label key={t} className="text-sm text-gray-400">{t}
              <input className={`${inputCls} mt-1 text-white`} type="number" min="0" value={tiers[t]} onChange={(e) => setTiers((p) => ({ ...p, [t]: e.target.value }))} /></label>)}
          <label className="text-sm text-gray-400">Convenience fee / ticket
            <input className={`${inputCls} mt-1 text-white`} type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} /></label>
        </div>
        <button onClick={savePrices} className="mt-4 bg-red-600 px-5 py-2 rounded text-sm font-semibold">Save pricing</button>
      </section>

      <section className="bg-[#181820] rounded-lg p-4">
        <h3 className="font-bold mb-3">Theaters & showtimes</h3>
        <div className="space-y-3">
          {rowsDraft.map((r, i) => <div key={i} className="grid md:grid-cols-[1fr_2fr_auto] gap-2 items-center">
              <input className={inputCls} value={r.name} onChange={(e) => upd(i, "name", e.target.value)} placeholder="Theater name" />
              <input className={inputCls} value={r.times} onChange={(e) => upd(i, "times", e.target.value)} placeholder="10:00 AM, 01:30 PM, 07:00 PM" />
              <button onClick={() => setRowsDraft((rs) => rs.filter((_, j) => j !== i))} className="border border-red-500 text-red-400 px-3 py-2 rounded text-sm">Remove</button>
            </div>)}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setRowsDraft((rs) => [...rs, { name: "", times: "" }])} className="border border-white/20 px-4 py-2 rounded text-sm">+ Add theater</button>
          <button onClick={saveShows} className="bg-red-600 px-5 py-2 rounded text-sm font-semibold">Save showtimes</button>
        </div>
      </section>
    </div>;
}
var toMin = (t) => {
  const [hm, ap] = t.split(" ");
  const [h, m2] = hm.split(":").map(Number);
  return (h % 12 + (ap === "PM" ? 12 : 0)) * 60 + m2;
};

// showbook/src/components/admin/AdminDashboard.jsx
var PASSCODE = "admin123";
var SESSION_KEY = "showbook:admin";
var TABS = [["analytics", "Analytics"], ["movies", "Movies"], ["shows", "Showtimes & Pricing"], ["bookings", "Bookings"]];
var readAuth = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
var writeAuth = (v) => {
  try {
    v ? sessionStorage.setItem(SESSION_KEY, "1") : sessionStorage.removeItem(SESSION_KEY);
  } catch {
  }
};
function AdminDashboard({ onExit }) {
  const { seedDemo, resetAll } = useStore();
  const [authed, setAuthed] = useState(readAuth);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("analytics");
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState(null);
  const login = (e) => {
    e.preventDefault();
    if (code === PASSCODE) {
      writeAuth(true);
      setAuthed(true);
      setErr("");
    } else setErr("Incorrect passcode.");
  };
  const logout = () => {
    writeAuth(false);
    setAuthed(false);
    setCode("");
    onExit();
  };
  if (!authed) return <form onSubmit={login} className="max-w-sm mx-auto mt-16 bg-[#181820] rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">Admin sign-in</h2>
      <input type="password" autoFocus className={inputCls} placeholder="Passcode" value={code} onChange={(e) => setCode(e.target.value)} />
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <button className="w-full bg-red-600 py-2 rounded font-semibold">Enter</button>
      <p className="text-xs text-gray-500">Lab demo passcode: <code className="text-gray-300">{PASSCODE}</code></p>
    </form>;
  return <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-2xl font-bold">Admin Portal</h2>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setNotice({ ok: true, text: `Added ${seedDemo()} demo bookings.` })} className="border border-white/20 px-3 py-1.5 rounded">Load demo bookings</button>
          <button onClick={() => setConfirmReset(true)} className="border border-white/20 px-3 py-1.5 rounded">Reset data</button>
          <button onClick={logout} className="border border-red-500 text-red-400 px-3 py-1.5 rounded">Sign out</button>
        </div>
      </div>

      {notice && <Notice ok={notice.ok} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div className="flex gap-2 flex-wrap mb-6 border-b border-white/10 pb-3">
        {TABS.map(([id, label]) => <button
    key={id}
    onClick={() => setTab(id)}
    className={`px-4 py-1.5 rounded text-sm ${tab === id ? "bg-red-600" : "bg-[#181820] text-gray-300"}`}
  >{label}</button>)}
      </div>

      {tab === "analytics" && <Analytics />}
      {tab === "movies" && <MovieManager />}
      {tab === "shows" && <ShowsPricing />}
      {tab === "bookings" && <BookingsManager />}

      {confirmReset && <ConfirmModal
    title="Reset all data?"
    danger
    confirmLabel="Reset everything"
    onCancel={() => setConfirmReset(false)}
    onConfirm={() => {
      resetAll();
      setConfirmReset(false);
      setNotice({ ok: true, text: "All data reset to defaults." });
    }}
  >
          <p>This deletes every booking and restores the original movies, showtimes and pricing.</p>
        </ConfirmModal>}
    </div>;
}

// showbook/src/App.jsx
function Shell() {
  const { bookings } = useStore();
  const [step, setStep] = useState("home");
  const [movie, setMovie] = useState(null);
  const [show, setShow] = useState(null);
  const [order, setOrder] = useState(null);
  const reset = () => {
    setStep("home");
    setMovie(null);
    setShow(null);
    setOrder(null);
  };
  const go = (s) => {
    setOrder(null);
    setStep(s);
  };
  const activeCount = bookings.filter((b) => phase(b) === "Active").length;
  const nav = (id) => `px-3 py-1.5 rounded text-sm ${step === id ? "bg-white/10 text-white" : "text-gray-300 hover:text-white"}`;
  return <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[#181820] border-b border-white/10 px-4 md:px-6 py-3 flex justify-between items-center no-print">
        <button onClick={reset} className="text-2xl font-extrabold">
          Show<span className="text-red-500">Book</span>
        </button>
        <nav className="flex items-center gap-1">
          <button onClick={() => go("bookings")} className={nav("bookings")}>
            My Bookings{activeCount > 0 && <span className="ml-1.5 bg-red-600 text-xs rounded-full px-1.5 py-0.5">{activeCount}</span>}
          </button>
          <button onClick={() => go("admin")} className={nav("admin")}>Admin</button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {step === "home" && <Home onSelect={(m2) => {
    setMovie(m2);
    setStep("detail");
  }} />}
        {step === "detail" && movie && <MovieDetail movie={movie} onBack={reset} onBook={() => setStep("shows")} />}
        {step === "shows" && movie && <Showtimes movie={movie} onBack={() => setStep("detail")} onPick={(s) => {
    setShow(s);
    setStep("seats");
  }} />}
        {step === "seats" && movie && show && <SeatPicker movie={movie} show={show} onBack={() => setStep("shows")} onCheckout={setOrder} />}
        {step === "bookings" && <MyBookings onHome={reset} />}
        {step === "admin" && <AdminDashboard onExit={reset} />}
      </main>

      {order && movie && show && <Checkout
    movie={movie}
    show={show}
    order={order}
    onClose={() => setOrder(null)}
    onDone={reset}
    onViewBookings={() => go("bookings")}
  />}
    </div>;
}
function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}

// showbook/src/components/ErrorBoundary.jsx
var ErrorBoundary = class extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  resetData = () => {
    try {
      localStorage.removeItem("showbook:v1");
    } catch {
    }
    location.reload();
  };
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-400 text-sm max-w-md">{String(this.state.error.message || this.state.error)}</p>
        <div className="flex gap-3">
          <button onClick={() => location.reload()} className="bg-red-600 px-5 py-2 rounded font-semibold">Reload</button>
          <button onClick={this.resetData} className="border border-white/20 px-5 py-2 rounded">Reset saved data</button>
        </div>
      </div>;
  }
};

// showbook/src/main.jsx
createRoot(document.getElementById("root")).render(<ErrorBoundary><App /></ErrorBoundary>);
