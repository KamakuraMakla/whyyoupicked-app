import { useState } from 'react'
import { toCategoryLabel } from '../categoryLabels'

function NewsCard({ article, onSelect, isActive, isLiked, onToggleLike }) {
  const [shareStatus, setShareStatus] = useState('')

  // Fallback text keeps the card readable even when the external API omits metadata.
  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleString('ja-JP')
    : '日時不明'

  const handleLikeClick = (event) => {
    event.stopPropagation()
    onToggleLike(article, !isLiked)
  }

  const handleShareClick = async (event) => {
    event.stopPropagation()
    const sharePayload = {
      title: article.title,
      text: `気になる記事: ${article.title}`,
      url: article.url,
    }

    try {
      if (navigator.share) {
        await navigator.share(sharePayload)
        setShareStatus('共有しました')
      } else if (navigator.clipboard && article.url) {
        await navigator.clipboard.writeText(article.url)
        setShareStatus('URLをコピーしました')
      } else {
        setShareStatus('共有に失敗しました')
      }
    } catch {
      setShareStatus('共有をキャンセルしました')
    }

    setTimeout(() => setShareStatus(''), 1800)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(article)
    }
  }

  return (
    <article
      className={`group flex min-h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-5 text-left shadow-soft transition duration-200 ${
        isActive
          ? 'translate-y-[-2px] border-teal-600/60 shadow-card ring-1 ring-teal-500/30'
          : 'hover:translate-y-[-2px] hover:border-teal-600/45 hover:shadow-card'
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(article)}
      onKeyDown={handleKeyDown}
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
        <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">{toCategoryLabel(article.category)}</span>
        <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">Popularity {article.popularity}</span>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
          aria-label="この記事を共有"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M15.5 13.25a2.25 2.25 0 0 0-1.66.73L7.18 10.9a2.5 2.5 0 0 0 0-1.8l6.66-3.08a2.25 2.25 0 1 0-.63-1.37L6.55 7.73a2.25 2.25 0 1 0 0 4.54l6.66 3.08a2.25 2.25 0 1 0 2.29-2.1Z" />
          </svg>
          <span>共有</span>
        </button>
        <button
          type="button"
          onClick={handleLikeClick}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            isLiked
              ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
              : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600'
          }`}
          aria-pressed={isLiked}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d="M2.75 9.25A1.25 1.25 0 0 1 4 8h2.2c.36 0 .7-.17.92-.46l2.95-3.93a1.4 1.4 0 0 1 2.49.85V8h2.68c1.2 0 2.12 1.08 1.93 2.27l-.89 5.5A2.25 2.25 0 0 1 14.06 17H6.5A3.75 3.75 0 0 1 2.75 13.25v-4Zm3 7.75V8.5H4v4.75A2.5 2.5 0 0 0 6.5 15.75h7.56a1 1 0 0 0 .99-.84l.89-5.5A.75.75 0 0 0 15.2 8.5h-3.9V4.46l-2.89 3.85A2.4 2.4 0 0 1 6.2 9.5H5.75V17Z" />
          </svg>
          <span>{isLiked ? 'Good済み' : 'Good'}</span>
        </button>
      </div>
      {shareStatus && <p className="mt-2 text-right text-xs text-slate-500">{shareStatus}</p>}
    </article>
  )
}

export default NewsCard