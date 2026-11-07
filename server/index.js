import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-this-secret';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

let pool;

function mysqlConfig() {
  if (process.env.MYSQL_URL) {
    const url = new URL(process.env.MYSQL_URL);
    return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined };
  }
  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'showbook',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
}

async function initializeDatabase() {
  const config = mysqlConfig();
  pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
  await pool.query('SELECT 1');
  const schema = await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8');
  for (const statement of schema.split(';').map(s => s.trim()).filter(Boolean)) await pool.query(statement);

  const [movieCount] = await pool.query('SELECT COUNT(*) AS count FROM movies');
  if (movieCount[0].count === 0) {
    const movieRows = [
      ['Midnight Chase','Action',8.1,'English','2h 15m','12 Oct 2026','A retired driver is pulled back for one last high-speed job across the city.','https://picsum.photos/seed/MidnightChase/400/600','https://picsum.photos/seed/MidnightChase/1200/500'],
      ['Silent Waves','Drama',8.6,'Hindi','2h 30m','05 Oct 2026',"A fisherman’s family faces choices when a storm changes their coastal village.",'https://picsum.photos/seed/SilentWaves/400/600','https://picsum.photos/seed/SilentWaves/1200/500'],
      ['Laugh Riot','Comedy',7.4,'Telugu','2h 05m','18 Oct 2026','Three friends accidentally become wedding planners for the wrong family.','https://picsum.photos/seed/LaughRiot/400/600','https://picsum.photos/seed/LaughRiot/1200/500'],
      ['Orbit Zero','Sci-Fi',8.9,'English','2h 40m','20 Oct 2026','A crew on a failing space station must decide who gets the last escape pod.','https://picsum.photos/seed/OrbitZero/400/600','https://picsum.photos/seed/OrbitZero/1200/500'],
      ['Shadow Files','Thriller',7.9,'Hindi','2h 10m','01 Oct 2026','A journalist uncovers a conspiracy hidden inside city archives.','https://picsum.photos/seed/ShadowFiles/400/600','https://picsum.photos/seed/ShadowFiles/1200/500'],
      ['Iron Dawn','Action',7.7,'Tamil','2h 25m','22 Oct 2026','A soldier returns home to defend his town from a ruthless syndicate.','https://picsum.photos/seed/IronDawn/400/600','https://picsum.photos/seed/IronDawn/1200/500']
    ];
    await pool.query('INSERT INTO movies (title,genre,rating,language,duration,release_date,synopsis,poster,banner) VALUES ?', [movieRows]);
  }

  for (const name of ['PVR Cinemas: City Centre','INOX: Grand Mall','Cinepolis: Lake View']) {
    await pool.query('INSERT IGNORE INTO theaters (name) VALUES (?)', [name]);
  }
  const [seatCount] = await pool.query('SELECT COUNT(*) AS count FROM seats');
  if (seatCount[0].count === 0) {
    const rows = [['A','Silver',150],['B','Silver',150],['C','Silver',150],['D','Gold',250],['E','Gold',250],['F','Gold',250],['G','Platinum',400],['H','Platinum',400]];
    for (const [row, category, price] of rows) for (let number = 1; number <= 10; number++) await pool.query('INSERT IGNORE INTO seats (row_label,seat_number,category,price) VALUES (?,?,?,?)', [row,number,category,price]);
  }

  const [[showCount]] = await pool.query('SELECT COUNT(*) AS count FROM shows');
  if (showCount.count === 0) {
    const [movies] = await pool.query('SELECT id FROM movies LIMIT 6');
    const [theaters] = await pool.query('SELECT id FROM theaters');
    const times = ['10:00:00','13:30:00','16:45:00','20:00:00'];
    const today = new Date();
    for (let day = 0; day < 3; day++) {
      const date = new Date(today); date.setDate(today.getDate() + day);
      const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      for (const movie of movies) for (const theater of theaters) for (const time of times) await pool.query('INSERT IGNORE INTO shows (movie_id,theater_id,show_date,show_time) VALUES (?,?,?,?)',[movie.id,theater.id,iso,time]);
    }
  }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try { req.user = jwt.verify(token, jwtSecret); next(); } catch { res.status(401).json({ error: 'Invalid or expired session.' }); }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (!name || !email || password.length < 6) return res.status(400).json({ error: 'Name, valid email, and a password of at least 6 characters are required.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [name,email,hash]);
    const user = { id: result.insertId, name, email, role: 'customer' }; const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' }); res.status(500).json({ error: 'Could not create account.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT id,name,email,password_hash,role FROM users WHERE email=? LIMIT 1',[email]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ error: 'Incorrect email or password.' });
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role }; const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });
  res.json({ token, user });
});

app.get('/api/catalog', async (_req, res) => {
  const [movies] = await pool.query('SELECT id,title,genre,rating,language,duration,release_date AS `release`,synopsis,poster,banner FROM movies ORDER BY id');
  const [theaters] = await pool.query('SELECT id,name FROM theaters ORDER BY id');
  const [seatRows] = await pool.query('SELECT row_label AS rowLabel,category,price FROM seats ORDER BY row_label LIMIT 8');
  res.json({ movies, theaters, seats: seatRows });
});

app.get('/api/shows/:movieId', async (req,res) => {
  const [rows] = await pool.query(`SELECT s.id,s.show_date AS showDate,s.show_time AS showTime,t.name AS theaterName FROM shows s JOIN theaters t ON t.id=s.theater_id WHERE s.movie_id=? ORDER BY s.show_date,s.show_time,t.name`,[req.params.movieId]);
  res.json({ shows: rows });
});

app.get('/api/bookings/taken/:showId', async (req,res) => {
  const [rows] = await pool.query(`SELECT s.row_label,s.seat_number FROM booking_seats bs JOIN seats s ON s.id=bs.seat_id JOIN bookings b ON b.id=bs.booking_id WHERE b.show_id=? AND b.status='Confirmed'`,[req.params.showId]);
  res.json({ taken: rows.map(r => `${r.row_label}${r.seat_number}`) });
});

app.post('/api/bookings', authenticate, async (req,res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const showId = Number(req.body.showId); const seatIds = [...new Set(req.body.seatIds || [])].map(Number);
    if (!showId || !seatIds.length || seatIds.length > 8) throw new Error('Invalid booking request.');
    const [occupied] = await connection.query(`SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON b.id=bs.booking_id WHERE b.show_id=? AND b.status='Confirmed' AND bs.seat_id IN (?) FOR UPDATE`,[showId,seatIds]);
    if (occupied.length) throw Object.assign(new Error('One or more seats were just booked.'),{status:409});
    const [seatRows] = await connection.query('SELECT id,price FROM seats WHERE id IN (?)',[seatIds]);
    if (seatRows.length !== seatIds.length) throw Object.assign(new Error('Invalid seat selection.'),{status:400});
    const subtotal = seatRows.reduce((sum,s)=>sum+Number(s.price),0); const convenienceFee=25*seatRows.length; const total=subtotal+convenienceFee;
    const bookingId='SB'+Date.now().toString(36).slice(-6).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
    await connection.query('INSERT INTO bookings (id,user_id,show_id,status,subtotal,convenience_fee,total,payment_method) VALUES (?,?,?,\'Confirmed\',?,?,?,?)',[bookingId,req.user.id,showId,subtotal,convenienceFee,total,req.body.paymentMethod || 'Demo Payment']);
    await connection.query('INSERT INTO booking_seats (booking_id,seat_id) VALUES ?',[seatIds.map(seatId=>[bookingId,seatId])]);
    await connection.commit();
    res.status(201).json({ id: bookingId, subtotal, convenienceFee, total });
  } catch(error) { await connection.rollback(); res.status(error.status || 500).json({ error:error.status ? error.message : 'Booking could not be completed.' }); }
  finally { connection.release(); }
});

app.get('/api/bookings/my', authenticate, async (req,res) => {
  const [rows] = await pool.query(`SELECT b.id,b.status,b.subtotal,b.convenience_fee AS convenienceFee,b.total,b.created_at AS createdAt,m.title AS movieTitle,t.name AS theaterName,s.show_date AS showDate,s.show_time AS showTime,GROUP_CONCAT(CONCAT(se.row_label,se.seat_number) ORDER BY se.row_label,se.seat_number SEPARATOR ', ') AS seats FROM bookings b JOIN shows s ON s.id=b.show_id JOIN movies m ON m.id=s.movie_id JOIN theaters t ON t.id=s.theater_id LEFT JOIN booking_seats bs ON bs.booking_id=b.id LEFT JOIN seats se ON se.id=bs.seat_id WHERE b.user_id=? GROUP BY b.id ORDER BY b.created_at DESC`,[req.user.id]);
  res.json({ bookings: rows });
});

app.post('/api/seats/map', authenticate, async (req,res) => {
  const labels = Array.isArray(req.body.labels) ? req.body.labels : [];
  const [rows] = await pool.query('SELECT id,row_label,seat_number FROM seats WHERE CONCAT(row_label,seat_number) IN (?)',[labels]);
  res.json({ seats: rows });
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req,res) => res.sendFile(path.join(distPath,'index.html')));

initializeDatabase().then(() => app.listen(port, () => console.log(`ShowBook server running on port ${port}`))).catch(error => { console.error('Database initialization failed:', error); process.exit(1); });