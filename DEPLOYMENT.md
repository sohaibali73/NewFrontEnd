# Deployment Guide

This backend is fully serverless - all data is stored in **Supabase** (cloud database) and uses **Claude API**, **Tavily API** for AI/research features.

---

## 🚂 Deploy to Railway (Recommended)

### Quick Deploy Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push
   ```

2. **Go to [Railway](https://railway.app)**
   - Sign up/login with GitHub
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select: `sohaibali73/Potomac-Analyst-Workbench`

3. **Configure Environment Variables:**
   Go to your project → **Variables** tab and add:

   | Variable | Value |
   |----------|-------|
   | `ANTHROPIC_API_KEY` | Your Anthropic (Claude) API key |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_KEY` | Your Supabase anon key |
   | `TAVILY_API_KEY` | Your Tavily API key |
   | `SECRET_KEY` | A strong random string (for JWT) |

4. **Deploy!**
   Railway will automatically:
   - Detect Python project
   - Install dependencies from `requirements.txt`
   - Run `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Get your URL:**
   - Go to **Settings** → **Networking** → **Generate Domain**
   - Your API will be at: `https://your-project.up.railway.app`

### Update Your Frontend

Change your frontend environment variable:
```env
VITE_API_URL=https://your-project.up.railway.app
```

---

## 🎯 Verify Deployment

Test your deployment with:

```bash
# Health check
curl https://your-project.up.railway.app/health

# List routes  
curl https://your-project.up.railway.app/routes

# Root endpoint
curl https://your-project.up.railway.app/
```

---

## 📁 Architecture - Everything is Cloud-Based

| Component | Service | Notes |
|-----------|---------|-------|
| **Database** | Supabase (PostgreSQL) | All user data, conversations, documents |
| **AI Chat** | Claude API (Anthropic) | With web search capability |
| **Research** | Tavily API | Real-time market research |
| **File Processing** | In-memory | Files uploaded → processed → stored in Supabase |
| **Authentication** | JWT tokens | Stored in Supabase users table |

**No local storage required** - the backend is completely stateless and can scale horizontally.

---

## 🔐 Security Checklist

- ✅ `.env` is in `.gitignore` (secrets not committed)
- ✅ All API keys set via Railway environment variables
- ✅ Use a strong, unique `SECRET_KEY` in production
- ✅ CORS configured (update `allow_origins` for production)

---

## 🛠 Files for Deployment

| File | Purpose |
|------|---------|
| `railway.json` | Railway configuration |
| `Procfile` | Start command definition |
| `nixpacks.toml` | Build configuration |
| `requirements.txt` | Python dependencies |
| `runtime.txt` | Python version (3.11.0) |

---

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (usually enough for development)
- **Hobby**: $5/month + usage
- **Pro**: $20/month + usage (team features)

Railway does **not** spin down services on the hobby plan, so no cold starts!

---

## 🔄 Alternative: Render

If you prefer Render, the `render.yaml` file is also included. Follow similar steps but use Render's dashboard instead.