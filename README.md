# Why you picked?

ニュース記事を選ぶ行動を可視化・記録する自己分析プロトタイプアプリです。  
記事をクリックするたびに「なぜその記事を選んだか」を問い、リフレクションを蓄積することで自分の情報消費パターンを把握できます。
(AI駆動開発です。また、本作品は練習用作品であり、2026年4月1日現在、デプロイは行っていません。)
---
## スクリーンショット
<img width="763" height="809" alt="image" src="https://github.com/user-attachments/assets/5d02e2f8-c874-45b1-90bc-1de7ca5e4cd2" />
<img width="1487" height="918" alt="image" src="https://github.com/user-attachments/assets/d5f0613a-4cf5-4990-984d-f2e19a630e7a" />
<img width="870" height="852" alt="image" src="https://github.com/user-attachments/assets/2d97ea61-dcb1-4ffe-9d60-bef263a1c286" />


## 機能一覧

| 機能 | 説明 |
|---|---|
| ニュース検索 | NewsAPI 経由でキーワード検索（日本語記事優先・毎回ランダム表示） |
| 記事クリック記録 | クリックした記事をDBに自動保存 |
| リフレクション（5問） | カテゴリ別の設問でクリック動機を深掘り |
| 傾向パネル | セッション＋DB履歴を合算したカテゴリ傾向をトップに表示 |
| 履歴・傾向ページ | 記事クリック履歴・検索クエリ履歴・リフレクション記録・カテゴリ棒グラフ |
| ユーザー認証 | JWT ベースの登録・ログイン（データはユーザーごとに分離） |

---

## 技術スタック

### フロントエンド

| 技術 | バージョン |
|---|---|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| React Router | 6 |

### バックエンド

| 技術 | バージョン |
|---|---|
| Python | 3.13 |
| Flask | 3.1 |
| SQLite | （組み込み） |
| PyJWT | 2 |
| Werkzeug | （パスワードハッシュ） |

---

## ディレクトリ構成

```
NewsApp/
├── backend/
│   ├── app.py                  # Flask エントリポイント
│   ├── requirements.txt
│   ├── .env                    # 環境変数（要作成、下記参照）
│   ├── newsapp.db              # SQLite データベース（自動生成）
│   └── news_app/
│       ├── __init__.py         # create_app・Blueprint 登録
│       ├── config.py           # 設定値（パス・API URL・SECRET_KEY）
│       ├── db.py               # DB 接続・テーブル初期化
│       ├── routes/
│       │   ├── auth.py         # /api/auth/* （登録・ログイン・検証）
│       │   ├── news.py         # /api/news
│       │   └── history.py      # /api/history/*
│       └── services/
│           ├── auth_service.py # JWT 生成・検証・パスワードハッシュ
│           └── news_service.py # NewsAPI 取得・正規化・カテゴリ推定
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx            # BrowserRouter でラップ
        ├── App.jsx             # メインページ（認証・記事一覧・傾向パネル）
        ├── styles.css
        ├── components/
        │   ├── AuthForm.jsx    # ログイン / 新規登録フォーム
        │   └── NewsCard.jsx    # 記事カード
        └── pages/
            └── HistoryPage.jsx # 履歴・傾向ページ（/history）
```

---

## セットアップ

### 前提条件

- Python 3.13+
- Node.js 20+
- [NewsAPI](https://newsapi.org/) の API キー（無料プランで取得可能）

---

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd NewsApp
```

### 2. バックエンドのセットアップ

```bash
# 仮想環境を作成・有効化
python -m venv .venv
.venv\Scripts\Activate.ps1       # Windows PowerShell
# source .venv/bin/activate      # macOS / Linux

# 依存パッケージをインストール
pip install -r backend/requirements.txt
pip install PyJWT
```

`.env` ファイルを作成します:

```bash
cp backend/.env.example backend/.env
```

`backend/.env` を編集して API キーと SECRET_KEY を設定:

```env
NEWS_API_KEY=your_newsapi_key_here
SECRET_KEY=your-random-secret-key-here
```

> **注意**: `SECRET_KEY` は本番環境では必ず推測不可能なランダム文字列を使用してください。

### 3. フロントエンドのセットアップ

```bash
npm --prefix frontend install
```

---

## 起動方法

### バックエンド（Flask）

```bash
# ワークスペースルートから実行
& ".venv\Scripts\python.exe" -m flask --app backend/app.py run --debug
```

Flask が `http://127.0.0.1:5000` で起動します。  
初回起動時に `backend/newsapp.db` が自動生成されます。

### フロントエンド（Vite 開発サーバー）

```bash
npm --prefix frontend run dev
```

`http://localhost:5173` でアプリにアクセスできます。  
Vite の proxy 設定により `/api/*` は自動的に Flask へ転送されます。

### プロダクションビルド

```bash
npm --prefix frontend run build
```

`frontend/dist/` にビルド成果物が生成されます。

---

## API エンドポイント

### 認証

| メソッド | パス | 説明 |
|---|---|---|
| `POST` | `/api/auth/register` | 新規ユーザー登録 |
| `POST` | `/api/auth/login` | ログイン（JWT 返却） |
| `GET` | `/api/auth/me` | トークン検証・ユーザー情報取得 |

### ニュース

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/news?q=<query>` | 記事取得（日本語優先・ランダム順） |

### 履歴

| メソッド | パス | 説明 |
|---|---|---|
| `POST` | `/api/history/view` | 閲覧履歴を保存 |
| `POST` | `/api/history/reflection` | リフレクションを保存 |
| `GET` | `/api/history` | 履歴一覧取得（認証時はユーザー別） |

---

## 環境変数

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `NEWS_API_KEY` | NewsAPI の API キー | なし（必須） |
| `SECRET_KEY` | JWT 署名用シークレット | `dev-secret-key-change-in-production` |

---

## ライセンス

MIT
