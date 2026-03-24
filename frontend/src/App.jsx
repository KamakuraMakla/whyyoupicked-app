import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import NewsCard from './components/NewsCard'
import { toCategoryLabel } from './categoryLabels'
import HistoryPage from './pages/HistoryPage'

const DEFAULT_QUERY = 'technology'
const JAPANESE_TOPICS = [
  '経済',
  '生成AI',
  '半導体',
  '宇宙開発',
  '気候変動',
  '教育',
  '医療',
  'スタートアップ',
  '防災',
  'エネルギー',
]

function isFreshArticle(publishedAt) {
  if (!publishedAt) {
    return false
  }

  const publishedTime = new Date(publishedAt).getTime()
  const oneDay = 24 * 60 * 60 * 1000
  return Date.now() - publishedTime <= oneDay
}

function buildSelectionReasons(article, nextHistory) {
  const reasons = []
  const sameCategoryCount = nextHistory.filter((category) => category === article.category).length

  if (article.popularity >= 75) {
    reasons.push('人気が高く、目につきやすい位置にありました')
  }

  if (sameCategoryCount >= 2) {
    reasons.push('あなたは最近このテーマの記事をよく見ています')
  }

  if (isFreshArticle(article.publishedAt)) {
    reasons.push('新着記事だったため、優先的に注意を引きました')
  }

  if (reasons.length === 0) {
    reasons.push('なんとなく目に入りました')
  }

  return reasons
}

function getQuestionConfig(category) {
  const fallback = {
    q1: 'この記事のどこに、最初の反応が起きましたか？',
    q2: 'その反応の奥には、どんな気持ちがありましたか？',
    q3: 'この記事を読んだあと、どんな行動につながりそうですか？',
    q4: 'この選択を振り返ると、どの価値観に近いですか？',
    triggerOptions: ['見出しの言葉', '要約の空気感', '媒体への信頼感', '新しさ', '説明しにくい直感'],
    moodOptions: ['今の自分に必要だと感じた', 'ふだんの関心と重なった', '周囲も気にしていそうだと思った', '不安や期待に触れた'],
    contextOptions: ['すぐ深掘りしたい', 'あとで読み返したい', '誰かに共有したい', '判断材料として保留したい'],
    decisionOptions: ['合理性を優先した選択', '感情を優先した選択', '習慣的な選択', '新しい関心への挑戦'],
  }

  const byCategory = {
    technology: {
      q1: 'テクノロジー記事として、どの要素に最初に反応しましたか？',
      q2: 'その反応は、どんな期待や不安につながっていましたか？',
      q3: 'この技術テーマを読んだ後、どんな次のアクションを取りたいですか？',
      q4: 'この選択は、あなたのどの判断軸に近いですか？',
      triggerOptions: ['技術キーワード', '将来への影響', '企業や製品名', '新しさ', '直感的な興味'],
      moodOptions: ['仕事や学習に役立つ', '乗り遅れたくない', '生活が変わりそう', '賛否を考えたくなった'],
      contextOptions: ['関連情報も調べたい', '仕事に活かせるか考える', '周囲の反応を見たい', 'まだ判断せず様子を見る'],
      decisionOptions: ['実用性重視', '将来性重視', 'リスク回避重視', '好奇心重視'],
    },
    business: {
      q1: 'ビジネス記事として、どこに最初に目が止まりましたか？',
      q2: 'その反応は、どんな判断意識につながっていましたか？',
      q3: 'この情報を受けて、次にどう動きたいですか？',
      q4: 'この選択は、あなたのどの価値判断に近いですか？',
      triggerOptions: ['市場や数字', '企業戦略', '景気の文脈', '自分の仕事との関連', '直感的な危機感'],
      moodOptions: ['先を読んでおきたい', '意思決定の材料にしたい', '損得の感覚が動いた', '変化の兆しを感じた'],
      contextOptions: ['仕事に反映したい', '追加データを確認したい', 'チームで共有したい', '一旦保留して観察したい'],
      decisionOptions: ['収益性重視', '安定性重視', '成長性重視', '社会性重視'],
    },
    science: {
      q1: 'サイエンス記事として、どのポイントに最初に惹かれましたか？',
      q2: 'その反応は、どんな知的欲求につながっていましたか？',
      q3: 'この内容を読んで、次に何をしたくなりましたか？',
      q4: 'この選択の背景には、どの価値が近いですか？',
      triggerOptions: ['研究結果そのもの', '社会への応用', '驚きの発見', '信頼できる根拠', '未知への好奇心'],
      moodOptions: ['仕組みを理解したい', '未来像を想像したい', '事実で判断したい', '可能性にわくわくした'],
      contextOptions: ['原典まで追いたい', '身近な影響を考えたい', '他分野とのつながりを見たい', 'まだ理解を深めたい'],
      decisionOptions: ['根拠重視', '新規性重視', '社会実装重視', '学習意欲重視'],
    },
    politics: {
      q1: '政治記事として、最初に反応したのはどの観点でしたか？',
      q2: 'その反応は、どんな価値観や不安に結びついていましたか？',
      q3: 'この内容を受けて、次にどう向き合いたいですか？',
      q4: 'この選択の背景にある判断軸はどれに近いですか？',
      triggerOptions: ['政策内容', '当事者の発言', '暮らしへの影響', '国際関係', '違和感を覚えた点'],
      moodOptions: ['立場を整理したい', '影響範囲を把握したい', '偏りを確かめたい', '納得できる説明が欲しい'],
      contextOptions: ['追加ソースを見たい', '異なる立場も確認したい', '生活への影響を考えたい', '感情を落ち着けて見直したい'],
      decisionOptions: ['公平性重視', '実利重視', '透明性重視', '長期視点重視'],
    },
    sports: {
      q1: 'スポーツ記事として、最初に気になったのはどこでしたか？',
      q2: 'その反応は、どんな感情に近かったですか？',
      q3: 'この記事を読んだ後、どんな行動を取りたくなりましたか？',
      q4: 'この選択の理由として近いのはどれですか？',
      triggerOptions: ['結果や記録', '選手・チーム', '勝敗のドラマ', '戦術や内容', '直感的な推し感'],
      moodOptions: ['応援したくなった', '驚きが大きかった', '流れを追いたくなった', '感情が動いた'],
      contextOptions: ['次戦も追いたい', 'ハイライトを見たい', '誰かと話したい', '少し距離を置いて振り返りたい'],
      decisionOptions: ['応援熱量重視', '分析重視', '話題性重視', '気分重視'],
    },
    culture: {
      q1: 'カルチャー記事として、どの要素が最初に刺さりましたか？',
      q2: 'その反応は、どんな好みや感性につながっていましたか？',
      q3: 'この内容を見て、次にどんな動きをしたくなりましたか？',
      q4: 'この選択の背景として最も近いのはどれですか？',
      triggerOptions: ['作品・人物', '表現やデザイン', '時代性', '共感できる視点', '直感的な好き嫌い'],
      moodOptions: ['価値観が重なった', '感性を刺激された', '背景を知りたくなった', '気分にフィットした'],
      contextOptions: ['関連作品も見たい', '背景を調べたい', '感想を共有したい', '印象を寝かせたい'],
      decisionOptions: ['共感重視', '美意識重視', '新規性重視', '物語性重視'],
    },
  }

  return byCategory[category] || fallback
}

function App() {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const authTokenRef = useRef(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const username = localStorage.getItem('authUsername')
    if (token && username) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.ok) {
            authTokenRef.current = token
            setAuthToken(token)
            setAuthUser(username)
          } else {
            localStorage.removeItem('authToken')
            localStorage.removeItem('authUsername')
          }
        })
        .catch(() => {
          localStorage.removeItem('authToken')
          localStorage.removeItem('authUsername')
        })
        .finally(() => setAuthLoading(false))
    } else {
      setAuthLoading(false)
    }
  }, [])

  const handleAuth = (token, username) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('authUsername', username)
    authTokenRef.current = token
    setAuthToken(token)
    setAuthUser(username)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUsername')
    authTokenRef.current = null
    setAuthToken(null)
    setAuthUser(null)
    setLikedArticleIds(new Set())
  }

  // ── Article / reflection state ───────────────────────────────────────────
  const [articles, setArticles] = useState([])
  const [viewHistory, setViewHistory] = useState([])
  const [likedArticleIds, setLikedArticleIds] = useState(() => new Set())
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [selectedReasons, setSelectedReasons] = useState([])
  const [selectedTrigger, setSelectedTrigger] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedDecision, setSelectedDecision] = useState('')
  const [userNote, setUserNote] = useState('')
  const [isReflectionSaved, setIsReflectionSaved] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [inputValue, setInputValue] = useState('')
  const [randomPlaceholderTopic] = useState(() => {
    const index = Math.floor(Math.random() * JAPANESE_TOPICS.length)
    return JAPANESE_TOPICS[index]
  })
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreArticles, setHasMoreArticles] = useState(true)
  const [error, setError] = useState('')
  const loadMoreTriggerRef = useRef(null)
  const articlesRef = useRef([])
  const noNewArticleFetchesRef = useRef(0)

  useEffect(() => {
    articlesRef.current = articles
  }, [articles])

  const chipClass =
    'rounded-full border border-slate-300 bg-white px-3 py-2 text-slate-700 transition hover:border-teal-700/50 hover:text-teal-700'

  const requestArticles = async (nextQuery) => {
    const response = await fetch(`/api/news?q=${encodeURIComponent(nextQuery)}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '記事の取得に失敗しました')
    }

    return data.articles || []
  }

  const fetchArticles = async (nextQuery) => {
    setLoading(true)
    setError('')

    try {
      const articlesData = await requestArticles(nextQuery)
      setArticles(articlesData)
      setHasMoreArticles(true)
      noNewArticleFetchesRef.current = 0
      setSelectedArticle(null)
      setSelectedReasons([])
      setSelectedTrigger('')
      setSelectedMood('')
      setSelectedContext('')
      setSelectedDecision('')
      setUserNote('')
      setIsReflectionSaved(false)
      setIsDialogOpen(false)
      setSaveError('')
    } catch (fetchError) {
      setError(fetchError.message)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const refreshArticlesAfterSelect = async (nextQuery, excludedArticleIds) => {
    setLoading(true)
    setError('')

    try {
      const freshArticles = await requestArticles(nextQuery)
      const excludedSet = new Set(excludedArticleIds)
      const nonOverlapping = freshArticles.filter((item) => !excludedSet.has(item.id))

      // Prioritize unseen cards; fall back to fetched list when overlap is unavoidable.
      setArticles(nonOverlapping.length > 0 ? nonOverlapping : freshArticles)
      setHasMoreArticles(true)
      noNewArticleFetchesRef.current = 0
    } catch (refreshError) {
      setError(refreshError.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreArticles = useCallback(async () => {
    if (loading || loadingMore || !hasMoreArticles) {
      return
    }

    setLoadingMore(true)

    try {
      const fetched = await requestArticles(query)
      const existingIds = new Set(articlesRef.current.map((item) => item.id))
      const uniqueArticles = fetched.filter((item) => !existingIds.has(item.id))

      if (uniqueArticles.length > 0) {
        noNewArticleFetchesRef.current = 0
        setArticles((prev) => [...prev, ...uniqueArticles])
      } else {
        noNewArticleFetchesRef.current += 1
        if (noNewArticleFetchesRef.current >= 2) {
          setHasMoreArticles(false)
        }
      }
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMoreArticles, loading, loadingMore, query])

  useEffect(() => {
    const target = loadMoreTriggerRef.current
    if (!target) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreArticles()
        }
      },
      {
        root: null,
        rootMargin: '260px 0px',
        threshold: 0.1,
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [loadMoreArticles])

  // Fetch articles and seed view-history from DB once the user is authenticated
  useEffect(() => {
    if (!authUser) return
    fetchArticles(DEFAULT_QUERY)
    const token = authTokenRef.current
    fetch('/api/history?limit=200', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const categories = (d.viewHistory || [])
          .map((v) => v.category)
          .filter(Boolean)
          .reverse() // DB returns newest-first; reverse to chronological order
        setViewHistory(categories)

        const likedIds = new Set((d.likes || []).map((item) => item.articleId).filter(Boolean))
        setLikedArticleIds(likedIds)
      })
      .catch(() => {}) // silently ignore – trend panel falls back to empty state
  }, [authUser])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = inputValue.trim() || DEFAULT_QUERY
    setQuery(trimmed)
    fetchArticles(trimmed)
  }

  const postJson = async (url, body) => {
    const headers = { 'Content-Type': 'application/json' }
    if (authTokenRef.current) headers['Authorization'] = `Bearer ${authTokenRef.current}`
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || '保存に失敗しました')
    }

    return data
  }

  const handleSelectArticle = (article) => {
    const currentArticleIds = articles.map((item) => item.id)
    const nextHistory = [...viewHistory, article.category]
    const reasons = buildSelectionReasons(article, nextHistory)

    setViewHistory(nextHistory)
    setSelectedArticle(article)
    setSelectedReasons(reasons)
    setSelectedTrigger('')
    setSelectedMood('')
    setSelectedContext('')
    setSelectedDecision('')
    setUserNote('')
    setIsReflectionSaved(false)
    setIsDialogOpen(true)
    setSaveError('')

    postJson('/api/history/view', {
      articleId: article.id,
      title: article.title,
      source: article.source,
      category: article.category,
      publishedAt: article.publishedAt,
      url: article.url,
      query,
    }).catch((err) => {
      setSaveError(err.message)
    })

    refreshArticlesAfterSelect(query, currentArticleIds)
  }

  const handleToggleLike = async (article, nextLiked) => {
    setSaveError('')

    setLikedArticleIds((prev) => {
      const next = new Set(prev)
      if (nextLiked) {
        next.add(article.id)
      } else {
        next.delete(article.id)
      }
      return next
    })

    try {
      await postJson('/api/history/like', {
        articleId: article.id,
        title: article.title,
        source: article.source,
        category: article.category,
        publishedAt: article.publishedAt,
        url: article.url,
        query,
        liked: nextLiked,
      })
    } catch (err) {
      setLikedArticleIds((prev) => {
        const rollback = new Set(prev)
        if (nextLiked) {
          rollback.delete(article.id)
        } else {
          rollback.add(article.id)
        }
        return rollback
      })
      setSaveError(err.message)
    }
  }

  const canSaveReflection = Boolean(selectedTrigger && selectedMood && selectedContext && selectedDecision)

  const questionConfig = useMemo(() => getQuestionConfig(selectedArticle?.category), [selectedArticle])

  const trendSummary = useMemo(() => {
    if (viewHistory.length === 0) {
      return {
        total: 0,
        dominantCategory: 'まだ傾向なし',
        dominantRate: 0,
        topCategories: [],
        message: '記事を選び始めると、あなたの傾向がここに表示されます。',
      }
    }

    const counts = viewHistory.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    const topCategories = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const dominantCategory = topCategories[0][0]
    const dominantCategoryLabel = toCategoryLabel(dominantCategory)
    const dominantRate = Math.round((topCategories[0][1] / viewHistory.length) * 100)

    let message = '複数テーマをバランスよく見ています。'
    if (dominantRate >= 60) {
      message = `${dominantCategoryLabel}への集中が強く、関心軸がはっきりしています。`
    } else if (dominantRate >= 40) {
      message = `${dominantCategoryLabel}を中心に、関連テーマへも広げています。`
    }

    return {
      total: viewHistory.length,
      dominantCategory: dominantCategoryLabel,
      dominantRate,
      topCategories,
      message,
    }
  }, [viewHistory])

  const handleSaveReflection = async () => {
    if (!canSaveReflection) {
      return
    }

    setSaveError('')

    try {
      await postJson('/api/history/reflection', {
        articleId: selectedArticle?.id,
        category: selectedArticle?.category,
        trigger: selectedTrigger,
        mood: selectedMood,
        note: [
          `Q3: ${selectedContext}`,
          `Q4: ${selectedDecision}`,
          userNote.trim() ? `Q5メモ: ${userNote.trim()}` : '',
        ]
          .filter(Boolean)
          .join(' / '),
        query,
      })
      setIsReflectionSaved(true)
      setIsDialogOpen(false)
    } catch (err) {
      setIsReflectionSaved(false)
      setSaveError(err.message)
    }
  }

  // Auth guard
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <span className="loading-inline text-base font-medium">
          <span className="loading-spinner loading-spinner-lg" aria-hidden="true" />
          <span>読み込み中...</span>
        </span>
      </div>
    )
  }
  if (!authUser) {
    return <AuthForm onAuth={handleAuth} />
  }

  return (
    <Routes>
      <Route
        path="/history"
        element={<HistoryPage token={authToken} username={authUser} onLogout={handleLogout} />}
      />
      <Route path="/*" element={<div className="relative mx-auto w-[min(1180px,calc(100%-64px))] py-10 pb-14 sm:w-[min(100%-56px,1180px)] sm:pt-6">
      <div className="pointer-events-none absolute -left-16 -top-10 h-44 w-44 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-16 h-52 w-52 rounded-full bg-teal-200/30 blur-3xl" />

      <header className="mb-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Link to="/" aria-label="トップへ戻る" className="inline-block">
            <img
              src="/logo.png"
              alt="Why you picked?"
              className="mb-4 h-20 w-auto rounded-2xl drop-shadow-[0_5px_10px_rgba(15,23,42,0.14)] transition hover:opacity-95 sm:h-24"
            />
          </Link>
          <p className="mt-4 max-w-[56ch] text-[1.02rem] text-slate-600">
            記事をクリックすると、なぜそのニュースに惹かれたのかをシンプルなロジックで可視化します。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{authUser}</span> としてログイン中
            </span>
            <Link
              to="/history"
              className="rounded-lg border border-teal-600/40 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 active:scale-95"
            >
              履歴 &amp; 傾向 →
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              ログアウト
            </button>
          </div>
        </div>

        <form
          className="rounded-3xl border border-slate-200/75 bg-white/90 p-5 shadow-soft backdrop-blur"
          onSubmit={handleSubmit}
        >
          <label htmlFor="query" className="mb-2.5 block text-[0.92rem] text-slate-500">
            ニュース検索
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              id="query"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={`例: ${randomPlaceholderTopic}`}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none ring-teal-700/25 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-3.5 text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <span className="loading-inline">
                  <span className="loading-spinner" aria-hidden="true" />
                  <span>読み込み中...</span>
                </span>
              ) : (
                '検索'
              )}
            </button>
          </div>
        </form>
      </header>

      <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-soft backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold text-slate-900">あなたが選んでいる記事の傾向</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            通算 {trendSummary.total} 件（DB履歴含む）
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="mb-1 text-xs text-slate-500">主要カテゴリ</p>
            <p className="m-0 text-lg font-semibold text-slate-900">{trendSummary.dominantCategory}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="mb-1 text-xs text-slate-500">偏り率</p>
            <p className="m-0 text-lg font-semibold text-slate-900">{trendSummary.dominantRate}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="mb-1 text-xs text-slate-500">最近の選択</p>
            <div className="flex flex-wrap gap-1.5">
              {viewHistory.length > 0 ? (
                viewHistory.slice(-4).reverse().map((category, index) => (
                  <span key={`${category}-${index}`} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                    {toCategoryLabel(category)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">まだデータがありません</span>
              )}
            </div>
          </div>
        </div>

        <p className="mb-0 mt-3 text-sm text-slate-600">{trendSummary.message}</p>

        {trendSummary.topCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {trendSummary.topCategories.slice(0, 5).map(([category, count]) => (
              <span key={category} className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                {toCategoryLabel(category)} {count}件
              </span>
            ))}
          </div>
        )}
      </section>

      <main className="grid grid-cols-1 gap-6">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[1.1rem] font-semibold">記事一覧</h2>
            <span className="text-[0.92rem] text-slate-500">
              {query} / {articles.length}件
            </span>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-600/25 bg-red-50/95 p-[18px] text-red-700 shadow-soft backdrop-blur">
              {error}
            </div>
          )}
          {loading && (
            <div className="rounded-3xl border border-slate-300/40 bg-white/90 p-[18px] text-slate-600 shadow-soft backdrop-blur">
              <span className="loading-inline font-medium">
                <span className="loading-spinner" aria-hidden="true" />
                <span>記事を取得しています...</span>
              </span>
            </div>
          )}
          {!loading && !error && articles.length === 0 && (
            <div className="rounded-3xl border border-slate-300/40 bg-white/90 p-[18px] text-slate-600 shadow-soft backdrop-blur">
              表示できる記事がありません。
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onSelect={handleSelectArticle}
                isActive={selectedArticle?.id === article.id}
                isLiked={likedArticleIds.has(article.id)}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>

          {!loading && !error && articles.length > 0 && (
            <>
              <div ref={loadMoreTriggerRef} className="h-1 w-full" aria-hidden="true" />
              <div className="mt-4 flex justify-center">
                {loadingMore && (
                  <span className="loading-inline text-sm text-slate-500">
                    <span className="loading-spinner" aria-hidden="true" />
                    <span>さらに記事を読み込み中...</span>
                  </span>
                )}
                {!loadingMore && !hasMoreArticles && (
                  <span className="text-xs text-slate-400">これ以上の新しい記事はありません</span>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {isDialogOpen && selectedArticle && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-2.5 backdrop-blur sm:items-center sm:p-5"
          role="presentation"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full overflow-auto rounded-t-2xl border border-slate-300/30 bg-white/95 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.26)] sm:w-[min(760px,100%)] sm:max-h-[88vh] sm:rounded-[20px]"
            role="dialog"
            aria-modal="true"
            aria-label="選択理由のポップアップ"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <h3 className="m-0 text-[1.12rem] font-semibold">なぜその記事を選んだか</h3>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                onClick={() => setIsDialogOpen(false)}
              >
                閉じる
              </button>
            </div>

            <p className="mb-2.5 text-[0.92rem] text-slate-500">選択中の記事</p>
            <h3 className="mb-3 text-xl font-semibold">{selectedArticle.title}</h3>
            {selectedArticle.imageUrl ? (
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                className="mb-3 h-52 w-full rounded-2xl border border-slate-200/80 object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <a
              href={selectedArticle.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-teal-600"
            >
              元記事を開く
            </a>

            <div className="my-5 grid gap-3">
              {selectedReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-xl border-l-4 border-teal-700 bg-gradient-to-br from-teal-700/10 to-white/95 px-4 py-3.5"
                >
                  {reason}
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2.5 text-[0.92rem] text-slate-500">あなた自身にも少し訊く</p>
              <p className="mb-4 text-slate-600">いまの選択を、短い対話でゆっくりほどいてみます。</p>

              <div>
                <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[0.78rem] font-bold uppercase tracking-[0.04em] text-teal-700">
                  Question 1
                </span>
                <p className="mb-2.5 font-semibold text-slate-700">{questionConfig.q1}</p>
                <div className="flex flex-wrap gap-2.5">
                  {questionConfig.triggerOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${chipClass} ${selectedTrigger === option ? 'border-teal-700 bg-teal-50 text-teal-700' : ''}`}
                      onClick={() => {
                        setSelectedTrigger(option)
                        setIsReflectionSaved(false)
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTrigger && (
                <div className="mt-[18px] animate-reveal border-t border-slate-200 pt-4">
                  <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[0.78rem] font-bold uppercase tracking-[0.04em] text-teal-700">
                    Question 2
                  </span>
                  <p className="mb-2.5 font-semibold text-slate-700">{questionConfig.q2}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {questionConfig.moodOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${chipClass} ${selectedMood === option ? 'border-teal-700 bg-teal-50 text-teal-700' : ''}`}
                        onClick={() => {
                          setSelectedMood(option)
                          setIsReflectionSaved(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedMood && (
                <div className="mt-[18px] animate-reveal border-t border-slate-200 pt-4">
                  <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[0.78rem] font-bold uppercase tracking-[0.04em] text-teal-700">
                    Question 3
                  </span>
                  <p className="mb-2.5 font-semibold text-slate-700">{questionConfig.q3}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {questionConfig.contextOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${chipClass} ${selectedContext === option ? 'border-teal-700 bg-teal-50 text-teal-700' : ''}`}
                        onClick={() => {
                          setSelectedContext(option)
                          setIsReflectionSaved(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedContext && (
                <div className="mt-[18px] animate-reveal border-t border-slate-200 pt-4">
                  <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[0.78rem] font-bold uppercase tracking-[0.04em] text-teal-700">
                    Question 4
                  </span>
                  <p className="mb-2.5 font-semibold text-slate-700">{questionConfig.q4}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {questionConfig.decisionOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${chipClass} ${selectedDecision === option ? 'border-teal-700 bg-teal-50 text-teal-700' : ''}`}
                        onClick={() => {
                          setSelectedDecision(option)
                          setIsReflectionSaved(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDecision && (
                <div className="mt-[18px] animate-reveal border-t border-slate-200 pt-4">
                  <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-[0.78rem] font-bold uppercase tracking-[0.04em] text-teal-700">
                    Question 5
                  </span>
                  <label className="mb-2.5 block font-semibold text-slate-700" htmlFor="user-note">
                    今の自分へのメモ
                  </label>
                  <textarea
                    id="user-note"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-700 outline-none ring-teal-700/25 focus:ring-2"
                    value={userNote}
                    onChange={(event) => {
                      setUserNote(event.target.value)
                      setIsReflectionSaved(false)
                    }}
                    placeholder="たとえば: 焦って情報を取りにいっている気がする。今の課題に近い話題だから惹かれた。"
                    rows="4"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      className="rounded-xl bg-teal-700 px-3.5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={handleSaveReflection}
                      disabled={!canSaveReflection}
                    >
                      この内省を保存する
                    </button>
                    <span className="text-sm text-slate-500">Question 1 から 4 まで回答すると保存できます</span>
                  </div>

                  {isReflectionSaved && (
                    <p className="mt-2.5 text-[0.92rem] font-semibold text-teal-700">
                      保存しました。次に似た記事を選んだ時の比較に使えます。
                    </p>
                  )}

                  {saveError && <p className="mt-2.5 text-sm text-red-700">{saveError}</p>}
                </div>
              )}

              {(selectedTrigger || selectedMood || selectedContext || selectedDecision || userNote.trim()) && (
                <div
                  className={`mt-4 animate-reveal rounded-2xl bg-gradient-to-br from-teal-700/10 to-white/95 p-4 ${
                    isReflectionSaved ? 'border border-teal-700/35' : ''
                  }`}
                >
                  <p className="mb-2.5 text-[0.92rem] text-slate-500">あなたの言葉で見る選択理由</p>
                  <ul className="ml-4 list-disc space-y-1.5 text-slate-700">
                    {selectedTrigger && <li>最初に気になったのは「{selectedTrigger}」でした。</li>}
                    {selectedMood && <li>感覚としては「{selectedMood}」に近い状態でした。</li>}
                    {selectedContext && <li>次の行動イメージは「{selectedContext}」でした。</li>}
                    {selectedDecision && <li>選択の軸としては「{selectedDecision}」に近いです。</li>}
                    {userNote.trim() && <li>メモ: {userNote.trim()}</li>}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="mb-2.5 text-[0.92rem] text-slate-500">最近見たカテゴリ</p>
              <div className="flex flex-wrap gap-2">
                {viewHistory.slice(-8).reverse().map((category, index) => (
                  <span key={`${category}-${index}`} className="rounded-full bg-teal-50 px-2.5 py-1 text-sm text-slate-600">
                    {toCategoryLabel(category)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>} />
    </Routes>
  )
}

export default App
