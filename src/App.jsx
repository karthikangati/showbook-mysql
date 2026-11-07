import { useState } from 'react'
import Auth from './components/Auth'
import Home from './components/Home'
import MovieDetail from './components/MovieDetail'
import Showtimes from './components/Showtimes'
import SeatPicker from './components/SeatPicker'
import Checkout from './components/Checkout'

function getSavedSession() {
  try { return JSON.parse(localStorage.getItem('showbook_demo_session') || 'null') }
  catch { return null }
}

export default function App() {
  const [user, setUser] = useState(getSavedSession)
  const [step, setStep] = useState('home')
  const [movie, setMovie] = useState(null)
  const [show, setShow] = useState(null)
  const [order, setOrder] = useState(null)

  const reset = () => { setStep('home'); setMovie(null); setShow(null); setOrder(null) }
  const signOut = () => {
    localStorage.removeItem('showbook_demo_session')
    setUser(null)
    reset()
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-white/10 bg-[#181820] px-6 py-4">
          <div className="mx-auto max-w-6xl">
            <span className="text-2xl font-extrabold">Show<span className="text-red-500">Book</span></span>
          </div>
        </header>
        <Auth onSuccess={setUser} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[#181820] border-b border-white/10 px-6 py-3 flex justify-between items-center gap-4">
        <button onClick={reset} className="text-2xl font-extrabold">
          Show<span className="text-red-500">Book</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-gray-400">Movies • Events • Sports</span>
          <span className="hidden md:inline text-sm text-gray-300">Hi, {user.name}</span>
          <button onClick={signOut} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-red-500 hover:text-red-400">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {step === 'home' && <Home onSelect={m => { setMovie(m); setStep('detail') }} />}
        {step === 'detail' && <MovieDetail movie={movie} onBack={reset} onBook={() => setStep('shows')} />}
        {step === 'shows' && <Showtimes movie={movie} onBack={() => setStep('detail')} onPick={s => { setShow(s); setStep('seats') }} />}
        {step === 'seats' && <SeatPicker movie={movie} show={show} onBack={() => setStep('shows')} onCheckout={setOrder} />}
      </main>

      {order && <Checkout movie={movie} show={show} order={order} onClose={() => setOrder(null)} onDone={reset} />}
    </div>
  )
}
