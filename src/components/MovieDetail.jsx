export default function MovieDetail({ movie: m, onBack, onBook }) {
  return (
    <div>
      <button onClick={onBack} className="text-gray-400 mb-4">← Back</button>
      <div className="flex flex-col md:flex-row gap-8">
        <img src={m.poster} alt={m.title} className="w-64 rounded-xl self-center md:self-start" />
        <div>
          <h1 className="text-4xl font-bold">{m.title}</h1>
          <p className="text-yellow-400 my-2">★ {m.rating}/10</p>
          <div className="flex gap-2 text-sm my-3 flex-wrap">
            {[m.genre, m.lang, m.duration, m.release].map(t => (
              <span key={t} className="bg-white/10 px-3 py-1 rounded">{t}</span>
            ))}
          </div>
          <h3 className="font-bold mt-4">About the movie</h3>
          <p className="text-gray-300">{m.synopsis}</p>
          <h3 className="font-bold mt-4">Cast</h3>
          <div className="flex gap-4 mt-2">
            {m.cast.map(c => (
              <div key={c} className="text-center text-sm">
                <div className="w-14 h-14 rounded-full bg-red-600/30 flex items-center justify-center text-lg font-bold mx-auto">{c[0]}</div>
                <p className="mt-1 w-20">{c}</p>
              </div>
            ))}
          </div>
          <button onClick={onBook} className="mt-8 bg-red-600 hover:bg-red-700 px-8 py-3 rounded font-semibold">Book Tickets</button>
        </div>
      </div>
    </div>
  )
}
