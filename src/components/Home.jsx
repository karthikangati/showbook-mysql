import { useEffect, useState } from 'react'
import { movies, genres } from '../mockData'

export default function Home({ onSelect }) {
  const [q, setQ] = useState('')
  const [g, setG] = useState('All')
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % 4), 4000)
    return () => clearInterval(t)
  }, [])

  const list = movies.filter(m =>
    (g === 'All' || m.genre === g) && m.title.toLowerCase().includes(q.toLowerCase()))
  const h = movies[i]

  return (
    <div>
      <div className="relative h-60 md:h-96 rounded-xl overflow-hidden mb-6">
        <img src={h.banner} alt={h.title} className="w-full h-full object-cover opacity-50" />
        <div className="absolute bottom-6 left-6">
          <p className="text-red-400 text-sm font-semibold">TRENDING NOW</p>
          <h2 className="text-3xl md:text-5xl font-bold">{h.title}</h2>
          <p className="text-gray-300">{h.genre} • {h.lang} • ★ {h.rating}</p>
          <button onClick={() => onSelect(h)} className="mt-3 bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold">Book Now</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search movies..."
          className="flex-1 bg-[#181820] border border-white/10 rounded px-4 py-2 outline-none focus:border-red-500" />
        <div className="flex gap-2 flex-wrap">
          {genres.map(x => (
            <button key={x} onClick={() => setG(x)}
              className={`px-3 py-1 rounded-full text-sm border ${g === x ? 'bg-red-600 border-red-600' : 'border-white/20 text-gray-300'}`}>{x}</button>
          ))}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Recommended Movies</h3>
      {list.length === 0 && <p className="text-gray-400">No movies found.</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {list.map(m => (
          <div key={m.id} onClick={() => onSelect(m)} className="cursor-pointer group">
            <img src={m.poster} alt={m.title} className="rounded-lg aspect-[2/3] object-cover w-full group-hover:scale-[1.03] transition" />
            <p className="font-semibold mt-2">{m.title}</p>
            <p className="text-sm text-gray-400">{m.genre} • {m.lang}</p>
            <p className="text-sm text-yellow-400">★ {m.rating}/10</p>
          </div>
        ))}
      </div>
    </div>
  )
}
