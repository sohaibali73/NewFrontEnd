# Deploy to Railway

This backend is fully serverless - all data is stored in **Supabase** (cloud database) and uses **Claude API**, **Tavily API** for AI/research features.

---

## 🚂 Quick Deploy Steps

1. **Go to [Railway](https://railway.app)**
   - Sign up/login with GitHub
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select: `sohaibali73/Potomac-Analyst-Workbench1`

2. **Configure Environment Variables:**
   Go to your project → **Variables** tab and add:

   | Variable | Value |
   |----------|-------|
   | `ANTHROPIC_API_KEY` | Your Anthropic (Claude) API key |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_KEY` | Your Supabase anon key |
   | `TAVILY_API_KEY` | Your Tavily API key |
   | `SECRET_KEY` | A strong random string (for JWT) |

3. **Deploy!**
   Railway will automatically:
   - Detect the Dockerfile
   - Build with Python 3.11
   - Install dependencies from `requirements.txt`
   - Run `uvicorn main:app`

4. **Get your URL:**
   - Go to **Settings** → **Networking** → **Generate Domain**
   - Your API will be at: `https://your-project.up.railway.app`

---

## 🎯 Verify Deployment

Test your deployment with:

```bash
# Health check
curl https://your-project.up.railway.app/health

# List routes  
curl https://your-project.up.railway.app/routes
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

**No local storage required** - the backend is completely stateless.

---

## 🔐 Security Checklist

- ✅ `.env` is in `.gitignore` (secrets not committed)
- ✅ All API keys set via Railway environment variables
- ✅ Use a strong, unique `SECRET_KEY` in production

---

## 🛠 Deployment Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container build configuration |
| `.dockerignore` | Excludes unnecessary files |
| `railway.json` | Railway configuration |
| `Procfile` | Start command |
| `requirements.txt` | Python dependencies |