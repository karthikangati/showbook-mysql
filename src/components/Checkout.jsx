import { useState } from 'react'
import { hash } from '../mockData'

function QR({ seed }) {
  const n = 13, h = hash(seed)
  return (
    <div className="grid gap-px bg-white p-2 w-32 h-32 mx-auto" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n * n }, (_, i) => {
        const corner = (i % n < 3 || i % n > n - 4) && (Math.floor(i / n) < 3 || (Math.floor(i / n) > n - 4 && i % n < 3))
        const on = corner || hash(seed + i + h) % 2 === 0
        return <div key={i} className={on ? 'bg-black' : 'bg-white'} />
      })}
    </div>
  )
}

export default function Checkout({ movie, show, order, onClose, onDone }) {
  const [paid, setPaid] = useState(false)
  const total = order.subtotal + order.fee
  const bookingId = 'SB' + hash(movie.title + show.time + order.seats.join()).toString().slice(0, 7)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-20">
      <div className="bg-[#181820] rounded-xl w-full max-w-md p-6">
        {!paid ? (
          <>
            <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              {[['Movie', movie.title], ['Theater', show.theater], ['Date', show.date], ['Time', show.time],
                ['Seats', order.seats.join(', ')], ['Tickets', `₹${order.subtotal}`],
                ['Convenience fee', `₹${order.fee}`]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span>{v}</span></div>
              ))}
              <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-3"><span>Total</span><span>₹{total}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 border border-white/20 py-2 rounded">Cancel</button>
              <button onClick={() => setPaid(true)} className="flex-1 bg-red-600 py-2 rounded font-semibold">Pay ₹{total}</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-green-400 text-center font-semibold mb-3">✓ Booking Confirmed</p>
            <div className="bg-white text-black rounded-lg p-5">
              <h4 className="text-lg font-bold">{movie.title}</h4>
              <p className="text-sm text-gray-600">{show.theater}</p>
              <p className="text-sm">{show.date} • {show.time}</p>
              <p className="text-sm font-semibold my-2">Seats: {order.seats.join(', ')}</p>
              <div className="border-t border-dashed border-gray-400 my-3" />
              <QR seed={bookingId} />
              <p className="text-center text-xs mt-2 text-gray-600">Booking ID: {bookingId}</p>
            </div>
            <button onClick={onDone} className="w-full mt-4 bg-red-600 py-2 rounded font-semibold">Back to Home</button>
          </>
        )}
      </div>
    </div>
  )
}
