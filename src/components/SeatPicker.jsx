import { useState } from 'react'
import { rows, seatsPerRow, hash, convenienceFee } from '../mockData'

const MAX = 8

export default function SeatPicker({ movie, show, onBack, onCheckout }) {
  const [sel, setSel] = useState([])
  const price = {}
  rows.forEach(([r, , p]) => (price[r] = p))

  const isSold = id => hash(`${movie.id}${show.theater}${show.time}${show.date}${id}`) % 5 === 0
  const toggle = id => {
    if (isSold(id)) return
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.length < MAX ? [...s, id] : s)
  }
  const subtotal = sel.reduce((a, id) => a + price[id[0]], 0)

  return (
    <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold">{movie.title}</h2>
      <p className="text-gray-400 mb-6">{show.theater} • {show.date} • {show.time}</p>

      <div className="overflow-x-auto">
        <div className="min-w-[420px] mx-auto w-fit">
          {rows.map(([r, cat, p], idx) => (
            <div key={r}>
              {(idx === 0 || rows[idx - 1][1] !== cat) && (
                <p className="text-xs text-gray-400 mt-4 mb-1">{cat.toUpperCase()} – ₹{p}</p>
              )}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-5 text-sm text-gray-400">{r}</span>
                {Array.from({ length: seatsPerRow }, (_, n) => {
                  const id = `${r}${n + 1}`
                  const sold = isSold(id), on = sel.includes(id)
                  return (
                    <button key={id} disabled={sold} onClick={() => toggle(id)} title={id}
                      className={`w-8 h-8 text-xs rounded-t-md border ${n === 4 ? 'mr-6' : ''} ${
                        sold ? 'bg-gray-700 border-gray-700 text-gray-500 cursor-not-allowed'
                        : on ? 'bg-green-500 border-green-500 text-black'
                        : 'border-green-500 text-green-400 hover:bg-green-500/20'}`}>{n + 1}</button>
                  )
                })}
              </div>
            </div>
          ))}
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
          <p className="text-sm text-gray-400">{sel.length ? sel.join(', ') : 'Select seats (max 8)'}</p>
          <p className="font-bold text-lg">₹{subtotal}</p>
        </div>
        <button disabled={!sel.length}
          onClick={() => onCheckout({ seats: sel, subtotal, fee: sel.length * convenienceFee })}
          className="bg-red-600 disabled:bg-gray-600 px-8 py-3 rounded font-semibold">Proceed</button>
      </div>
      <div className="h-24" />
    </div>
  )
}
