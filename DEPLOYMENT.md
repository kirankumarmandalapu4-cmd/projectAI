# Deployment Guide

This project is a **full-stack** app with separate frontend and backend services.

| Component | Tech | Recommended Host |
|-----------|------|------------------|
| Frontend | Next.js 14 | **Vercel** |
| Backend | FastAPI + SQLite + Qdrant | **Render Free** (demo Web Service) |

> **Free demo limitation:** Render Free has an ephemeral filesystem. Uploaded documents,
> SQLite data, Qdrant vectors, users, and conversations can be lost when the service
> restarts or spins down. Use a paid plan with a persistent disk for production data.

---

## 1. Push to GitHub

```powershell
cd C:\Users\kiran\OneDrive\Desktop\projectAI
git init
git add .
git commit -m "Initial commit: College RAG Chatbot with FastAPI + Next.js"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME/YOUR_REPO` with your actual GitHub repository.

---

## 2. Deploy Backend on Render

1. Go to [render.com](https://render.com) and connect your GitHub repo.
2. Choose **New Blueprint** and point to `render.yaml`, **or** create a **Web Service** manually:
   - **Root Directory:** leave empty (repo root)
   - **Runtime:** Docker
   - **Dockerfile Path:** `./server/Dockerfile`
   - **Health Check Path:** `/api/health`
3. Select the **Free** compute plan. Do not add a persistent disk.
4. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | Long random string (32+ chars) |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |
   | `LLM_API_KEY` | Your Gemini API key (optional) |
   | `EMBEDDING_PROVIDER` | `local` (works without API key) |

5. Deploy. Note your API URL, e.g. `https://college-rag-api.onrender.com`.

---

## 3. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and import the same GitHub repo.
2. Set **Root Directory** to `client`.
3. Add environment variable:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://college-rag-api.onrender.com` |

4. Deploy. Vercel auto-detects Next.js and runs `npm run build`.

---

## 4. Post-Deploy Checklist

1. Update Render `CORS_ORIGINS` to include your final Vercel URL.
2. Open the Vercel app and confirm **API connected** badge in the header.
3. Log in with `admin@college.edu` / `admin123`.
4. Upload a test document and ask a question in Chatbot.

---

## Why This Split?

- **Vercel** excels at Next.js static/SSR hosting with global CDN.
- **Render Free** supports this backend for temporary demonstrations, but its filesystem is ephemeral.
- Vercel alone cannot host the FastAPI backend.

---

## Local Development

```powershell
# Terminal 1 — Backend
cd server
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd client
npm run dev
```

Open `http://localhost:3000`.
