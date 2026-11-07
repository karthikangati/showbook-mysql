export const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`
export const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export const genres = ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller']

const m = (id, title, genre, rating, lang, duration, release, synopsis, cast) => ({
  id, title, genre, rating, lang, duration, release, synopsis, cast,
  poster: img(title.replace(/\s/g, ''), 400, 600),
  banner: img(title.replace(/\s/g, ''), 1200, 500),
})

export const movies = [
  m(1, 'Midnight Chase', 'Action', 8.1, 'English', '2h 15m', '12 Oct 2026', 'A retired driver is pulled back for one last high-speed job across the city.', ['Ravi Kumar', 'Anna Lee', 'Tom Hardy']),
  m(2, 'Silent Waves', 'Drama', 8.6, 'Hindi', '2h 30m', '05 Oct 2026', 'A fisherman’s family faces choices when a storm changes their coastal village.', ['Meera Nair', 'Arjun Rao', 'Sita Devi']),
  m(3, 'Laugh Riot', 'Comedy', 7.4, 'Telugu', '2h 05m', '18 Oct 2026', 'Three friends accidentally become wedding planners for the wrong family.', ['Karthik S', 'Priya V', 'Brahma Rao']),
  m(4, 'Orbit Zero', 'Sci-Fi', 8.9, 'English', '2h 40m', '20 Oct 2026', 'A crew on a failing space station must decide who gets the last escape pod.', ['Mia Chen', 'Luke Ford', 'Ana Silva']),
  m(5, 'Shadow Files', 'Thriller', 7.9, 'Hindi', '2h 10m', '01 Oct 2026', 'A journalist uncovers a conspiracy hidden inside city archives.', ['Neha Kapoor', 'Vikram J', 'Dev Anand']),
  m(6, 'Iron Dawn', 'Action', 7.7, 'Tamil', '2h 25m', '22 Oct 2026', 'A soldier returns home to defend his town from a ruthless syndicate.', ['Surya K', 'Anjali M', 'Ravi T']),
  m(7, 'Paper Hearts', 'Drama', 8.2, 'English', '1h 55m', '10 Oct 2026', 'Two strangers exchange letters after a mix-up at a post office.', ['Emma R', 'Liam K', 'Zoe P']),
  m(8, 'Galaxy Gang', 'Sci-Fi', 7.2, 'Telugu', '2h 00m', '15 Oct 2026', 'A group of kids find an alien who needs help getting home.', ['Teja M', 'Sai P', 'Lakshmi N']),
]

export const theaters = [
  { name: 'PVR Cinemas: City Centre', times: ['10:00 AM', '01:30 PM', '04:45 PM', '08:00 PM'] },
  { name: 'INOX: Grand Mall', times: ['11:15 AM', '02:30 PM', '07:00 PM', '10:15 PM'] },
  { name: 'Cinepolis: Lake View', times: ['09:45 AM', '12:50 PM', '06:15 PM'] },
]

// [row, category, price in ₹]
export const rows = [
  ['A', 'Silver', 150], ['B', 'Silver', 150], ['C', 'Silver', 150],
  ['D', 'Gold', 250], ['E', 'Gold', 250], ['F', 'Gold', 250],
  ['G', 'Platinum', 400], ['H', 'Platinum', 400],
]
export const seatsPerRow = 10
export const convenienceFee = 25 // per ticket
