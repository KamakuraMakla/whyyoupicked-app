import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '失敗しました')
      onAuth(data.token, data.username)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/40 px-6 sm:px-8">
      <div className="pointer-events-none fixed -left-20 top-10 h-60 w-60 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-32 h-60 w-60 rounded-full bg-teal-200/25 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
          Prototype
        </p>
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-slate-900">
          Why you picked?
        </h1>
        <Link to="/" aria-label="トップへ戻る" className="mx-auto mb-6 block w-fit">
          <img
            src="/logo.png"
            alt="Why you picked?"
            className="mx-auto h-28 w-auto rounded-2xl drop-shadow-[0_5px_10px_rgba(15,23,42,0.14)] transition hover:opacity-95 sm:h-36"
          />
        </Link>

        <div className="rounded-3xl border border-slate-200/75 bg-white/90 p-7 shadow-soft backdrop-blur">
          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="auth-username" className="mb-1.5 block text-sm text-slate-500">
                ユーザー名
              </label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例: reading_user"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-teal-700/25 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm text-slate-500">
                パスワード{mode === 'register' && <span className="text-slate-400">（6文字以上）</span>}
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-teal-700/25 focus:ring-2"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
