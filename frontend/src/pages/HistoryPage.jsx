import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toCategoryLabel } from '../categoryLabels'

const CATEGORY_COLORS = {
  technology: 'bg-violet-500',
  business: 'bg-amber-500',
  science: 'bg-sky-500',
  politics: 'bg-rose-500',
  sports: 'bg-emerald-500',
  culture: 'bg-pink-500',
  general: 'bg-slate-400',
}

const CATEGORY_TEXT = {
  technology: 'text-violet-700 bg-violet-50 border-violet-200',
  business: 'text-amber-700 bg-amber-50 border-amber-200',
  science: 'text-sky-700 bg-sky-50 border-sky-200',
  politics: 'text-rose-700 bg-rose-50 border-rose-200',
  sports: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  culture: 'text-pink-700 bg-pink-50 border-pink-200',
  general: 'text-slate-600 bg-slate-50 border-slate-200',
}

function fmt(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function isWithinLastDays(iso, days) {
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return false
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000
  return ts >= threshold
}

export default function HistoryPage({ token, username, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    const headers = {}
    const stored = token || localStorage.getItem('authToken')
    if (stored) headers['Authorization'] = `Bearer ${stored}`
    fetch('/api/history?limit=200', { headers })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [token])

  const stats = useMemo(() => {
    if (!data) return null
    const views = data.viewHistory || []
    const reflections = data.reflections || []

    // Category distribution
    const categoryCounts = views.reduce((acc, v) => {
      const cat = v.category || 'general'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
    const maxCount = categoryEntries[0]?.[1] || 1

    // Search query history
    const queryCounts = views.reduce((acc, v) => {
      if (v.query) acc[v.query] = (acc[v.query] || 0) + 1
      return acc
    }, {})
    const queryEntries = Object.entries(queryCounts).sort((a, b) => b[1] - a[1])

    // Trigger pattern
    const triggerCounts = reflections.reduce((acc, r) => {
      if (r.trigger) acc[r.trigger] = (acc[r.trigger] || 0) + 1
      return acc
    }, {})
    const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

    // Mood pattern
    const moodCounts = reflections.reduce((acc, r) => {
      if (r.mood) acc[r.mood] = (acc[r.mood] || 0) + 1
      return acc
    }, {})
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

    return { categoryEntries, maxCount, queryEntries, topTriggers, topMoods }
  }, [data])

  const views = data?.viewHistory || []
  const reflections = data?.reflections || []
  const likes = data?.likes || []
  const likedIds = useMemo(() => new Set(likes.map((item) => item.articleId)), [likes])

  const weeklyReport = useMemo(() => {
    const weeklyViews = views.filter((v) => isWithinLastDays(v.viewedAt, 7))
    const weeklyLikes = likes.filter((v) => isWithinLastDays(v.likedAt, 7))
    const weeklyReflections = reflections.filter((v) => isWithinLastDays(v.savedAt, 7))

    const categoryCounts = weeklyViews.reduce((acc, v) => {
      const cat = v.category || 'general'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || null

    const sourceCounts = weeklyLikes.reduce((acc, v) => {
      const source = v.source || '不明な媒体'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})
    const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || null

    const activityDays = new Set(
      [...weeklyViews.map((v) => v.viewedAt), ...weeklyLikes.map((v) => v.likedAt), ...weeklyReflections.map((v) => v.savedAt)]
        .filter(Boolean)
        .map((iso) => new Date(iso).toISOString().slice(0, 10))
    ).size

    return {
      views: weeklyViews.length,
      likes: weeklyLikes.length,
      reflections: weeklyReflections.length,
      topCategory: topCategoryEntry ? toCategoryLabel(topCategoryEntry[0]) : 'なし',
      topSource: topSourceEntry ? topSourceEntry[0] : 'なし',
      activityDays,
    }
  }, [views, likes, reflections])

  const handleShareArticle = async (article) => {
    const sharePayload = {
      title: article.title,
      text: `気になる記事: ${article.title}`,
      url: article.url,
    }

    try {
      if (navigator.share) {
        await navigator.share(sharePayload)
        setShareMessage('記事を共有しました')
      } else if (navigator.clipboard && article.url) {
        await navigator.clipboard.writeText(article.url)
        setShareMessage('記事URLをコピーしました')
      } else {
        setShareMessage('共有に失敗しました')
      }
    } catch {
      setShareMessage('共有をキャンセルしました')
    }

    setTimeout(() => setShareMessage(''), 1800)
  }

  return (
    <div className="relative mx-auto w-[min(1180px,calc(100%-64px))] py-10 pb-14 sm:w-[min(100%-56px,1180px)] sm:pt-6">
      <div className="pointer-events-none fixed -left-16 top-0 h-60 w-60 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-32 h-60 w-60 rounded-full bg-teal-200/25 blur-3xl" />

      {/* Header */}
      <header className="mb-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Link to="/" aria-label="トップへ戻る" className="inline-block">
            <img
              src="/logo.png"
              alt="Why you picked?"
              className="mb-4 h-20 w-auto rounded-2xl drop-shadow-[0_5px_10px_rgba(15,23,42,0.14)] transition hover:opacity-95 sm:h-24"
            />
          </Link>
          <p className="max-w-[56ch] text-[1.02rem] text-slate-600">
            あなたが選んだ記事と内省メモから、関心の傾向をわかりやすく可視化します。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              to="/"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              ← ニュース
            </Link>
            {username && (
              <span className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{username}</span> としてログイン中
              </span>
            )}
            {username && (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </header>

      {loading && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center text-slate-500 shadow-soft">
          <span className="loading-inline text-base font-medium">
            <span className="loading-spinner loading-spinner-lg" aria-hidden="true" />
            <span>読み込み中...</span>
          </span>
        </div>
      )}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-600 shadow-soft">
          {error}
        </div>
      )}
      {shareMessage && (
        <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700 shadow-soft">
          {shareMessage}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="mb-6 rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-white p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">週次レポート（過去7日）</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                アクティブ日数 {weeklyReport.activityDays} 日
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-teal-200 bg-white p-4">
                <p className="mb-1 text-xs text-slate-500">閲覧記事数</p>
                <p className="text-xl font-semibold text-slate-900">{weeklyReport.views}</p>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-white p-4">
                <p className="mb-1 text-xs text-slate-500">Good数</p>
                <p className="text-xl font-semibold text-slate-900">{weeklyReport.likes}</p>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-white p-4">
                <p className="mb-1 text-xs text-slate-500">内省保存数</p>
                <p className="text-xl font-semibold text-slate-900">{weeklyReport.reflections}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                よく見たカテゴリ: <span className="font-semibold text-slate-900">{weeklyReport.topCategory}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                よくGoodした媒体: <span className="font-semibold text-slate-900">{weeklyReport.topSource}</span>
              </div>
            </div>
          </section>

          {/* Trend analysis */}
          <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">カテゴリ別の傾向</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                合計 {views.length} 件
              </span>
            </div>

            {stats && stats.categoryEntries.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  {stats.categoryEntries.map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-right text-sm text-slate-600">{toCategoryLabel(cat)}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-4 rounded-full transition-all ${CATEGORY_COLORS[cat] || 'bg-slate-400'}`}
                          style={{ width: `${Math.round((count / stats.maxCount) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-sm font-semibold text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>

                {(stats.topTriggers.length > 0 || stats.topMoods.length > 0) && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {stats.topTriggers.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">よくクリックするきっかけ</p>
                        <ul className="flex flex-col gap-1.5">
                          {stats.topTriggers.map(([t, c]) => (
                            <li key={t} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{t}</span>
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">{c}回</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {stats.topMoods.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">よくある読む動機</p>
                        <ul className="flex flex-col gap-1.5">
                          {stats.topMoods.map(([m, c]) => (
                            <li key={m} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{m}</span>
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{c}回</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                まだ記事を選んでいません。記事をクリックすると傾向が蓄積されます。
              </p>
            )}
          </section>

          {/* Search query history */}
          {stats && stats.queryEntries.length > 0 && (
            <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur">
              <h2 className="mb-4 text-base font-semibold text-slate-900">検索クエリ履歴</h2>
              <div className="flex flex-wrap gap-2">
                {stats.queryEntries.map(([q, count]) => (
                  <span
                    key={q}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-700"
                  >
                    {q}
                    <span className="ml-1.5 text-xs text-slate-400">{count}件</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Article click history */}
          <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">いいねした記事</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {likes.length} 件
              </span>
            </div>
            {likes.length === 0 ? (
              <p className="text-sm text-slate-500">まだいいねした記事はありません</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {likes.map((v, i) => (
                  <div key={`${v.articleId}-${i}`} className="flex items-start gap-3 py-3.5">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_TEXT[v.category] || CATEGORY_TEXT.general}`}
                    >
                      {toCategoryLabel(v.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      {v.url ? (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-slate-800 hover:text-teal-700 hover:underline"
                        >
                          {v.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{v.title}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {v.source} · {fmt(v.likedAt)}
                        {v.query && <span className="ml-2 text-slate-300">検索: {v.query}</span>}
                      </p>
                    </div>
                    {v.url && (
                      <button
                        type="button"
                        onClick={() => handleShareArticle(v)}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
                      >
                        共有
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">記事クリック履歴</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {views.length} 件
              </span>
            </div>
            {views.length === 0 ? (
              <p className="text-sm text-slate-500">まだ記録がありません</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {views.map((v, i) => (
                  <div key={`${v.articleId}-${i}`} className="flex items-start gap-3 py-3.5">
                    <span
                      className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_TEXT[v.category] || CATEGORY_TEXT.general}`}
                    >
                      {toCategoryLabel(v.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      {v.url ? (
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-slate-800 hover:text-teal-700 hover:underline"
                        >
                          {v.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{v.title}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {v.source} · {fmt(v.viewedAt)}
                        {likedIds.has(v.articleId) && <span className="ml-2 text-rose-400">♥ いいね済み</span>}
                        {v.query && <span className="ml-2 text-slate-300">検索: {v.query}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reflections */}
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">リフレクション記録</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {reflections.length} 件
              </span>
            </div>
            {reflections.length === 0 ? (
              <p className="text-sm text-slate-500">
                まだリフレクションが保存されていません。記事を選んで質問に答えると記録されます。
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {reflections.map((r, i) => (
                  <div key={`${r.articleId}-${i}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {r.category && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_TEXT[r.category] || CATEGORY_TEXT.general}`}
                        >
                          {toCategoryLabel(r.category)}
                        </span>
                      )}
                      {r.trigger && (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs text-teal-700">
                          きっかけ: {r.trigger}
                        </span>
                      )}
                      {r.mood && (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs text-violet-700">
                          動機: {r.mood}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-slate-400">{fmt(r.savedAt)}</span>
                    </div>
                    {r.note && <p className="text-sm leading-relaxed text-slate-600">{r.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
