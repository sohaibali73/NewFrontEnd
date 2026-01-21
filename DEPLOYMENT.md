# Deploying to Render

This guide will help you deploy the Potomac Analyst API backend to Render.

## Prerequisites

- A [Render](https://render.com) account
- Your GitHub repository pushed with latest changes

## Quick Deploy Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `sohaibali73/Potomac-Analyst-Workbench`
4. Configure the service:
   - **Name:** `potomac-analyst-api`
   - **Region:** Oregon (or your preferred region)
   - **Branch:** `main`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Set Environment Variables

In the Render dashboard, go to your service → **Environment** tab and add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `TAVILY_API_KEY` | Your Tavily API key |
| `SECRET_KEY` | A strong random string for JWT signing |

### 4. Deploy

Click **"Create Web Service"** and wait for the deployment to complete.

Your API will be available at: `https://potomac-analyst-api.onrender.com`

## Update Your Frontend

Update your frontend environment to use the new Render URL:

```env
VITE_API_URL=https://potomac-analyst-api.onrender.com
```

## Verify Deployment

Test your deployment:

```bash
# Health check
curl https://potomac-analyst-api.onrender.com/health

# List routes
curl https://potomac-analyst-api.onrender.com/routes
```

## Important Notes

### Free Tier Limitations

- The service will spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- Consider upgrading to the Starter plan ($7/month) for always-on service

### Security Reminders

- ⚠️ Never commit your `.env` file to GitHub
- ⚠️ Always set environment variables through Render's dashboard
- ⚠️ Use a strong, unique `SECRET_KEY` in production

## Troubleshooting

### Build Fails

- Check the build logs in Render dashboard
- Ensure all dependencies in `requirements.txt` are compatible

### Service Won't Start

- Verify all required environment variables are set
- Check the logs for any import errors

### API Errors

- Verify your API keys are correctly set in Render
- Check Supabase connection settings

## Files Created for Deployment

- `render.yaml` - Render Blueprint specification
- `runtime.txt` - Python version specification
- `DEPLOYMENT.md` - This guide