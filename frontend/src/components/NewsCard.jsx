function NewsCard({ article, onSelect, isActive }) {
  // Fallback text keeps the card readable even when the external API omits metadata.
  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleString('ja-JP')
    : '日時不明'

  return (
    <button
      className={`group flex min-h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-5 text-left shadow-soft transition duration-200 ${
        isActive
          ? 'translate-y-[-2px] border-teal-600/60 shadow-card ring-1 ring-teal-500/30'
          : 'hover:translate-y-[-2px] hover:border-teal-600/45 hover:shadow-card'
      }`}
      type="button"
      onClick={() => onSelect(article)}
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="mb-3 h-40 w-full rounded-2xl border border-slate-200/80 object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="mb-3 flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500">
          画像なし
        </div>
      )}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>{article.source}</span>
        <span>{publishedLabel}</span>
      </div>
      <h3 className="my-3 line-clamp-3 break-words text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-slate-700">
        {article.title}
      </h3>
      <p className="line-clamp-4 break-words text-slate-600">{article.description}</p>
      <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-3 pt-4 text-sm text-slate-500">
        <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">{article.category}</span>
        <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">Popularity {article.popularity}</span>
      </div>
    </button>
  )
}

export default NewsCard