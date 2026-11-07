import { useState } from 'react'
import { theaters } from '../mockData'

const dates = [0, 1, 2].map(n => {
  const d = new Date(); d.setDate(d.getDate() + n)
  return { label: ['Today', 'Tomorrow'][n] || 'Day After', text: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
})

export default function Showtimes({ movie, onBack, onPick }) {
  const [d, setD] = useState(0)
  return (
    <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
      <div className="flex gap-3 mb-6">
        {dates.map((x, i) => (
          <button key={i} onClick={() => setD(i)}
            className={`px-5 py-2 rounded-lg text-center ${d === i ? 'bg-red-600' : 'bg-[#181820] border border-white/10'}`}>
            <div className="text-xs">{x.label}</div><div className="font-bold">{x.text}</div>
          </button>
        ))}
      </div>
      {theaters.map(t => (
        <div key={t.name} className="bg-[#181820] rounded-lg p-4 mb-4">
          <p className="font-semibold mb-3">{t.name}</p>
          <div className="flex gap-3 flex-wrap">
            {t.times.map(time => (
              <button key={time} onClick={() => onPick({ date: `${dates[d].label}, ${dates[d].text}`, theater: t.name, time })}
                className="border border-green-500 text-green-400 px-4 py-1 rounded hover:bg-green-500 hover:text-black text-sm">{time}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
