# ⚡ Quick Fix Checklist - 5 Minutes

Complete these steps to fix all server log errors.

---

## Step 1: Run Database Migration (2 min)

1. Open: https://supabase.com/dashboard/project/vekcfcmstpnxubxsaano/sql/new
2. Copy entire contents of `db/migrations/004_history_tables_FIXED.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. Verify: You should see "Success. No rows returned"

---

## Step 2: Get Service Role Key (1 min)

1. Open: https://supabase.com/dashboard/project/vekcfcmstpnxubxsaano/settings/api
2. Scroll to "Project API keys"
3. Click **Reveal** next to `service_role`
4. Copy the key (starts with `eyJhbGciOiJIUzI1NiIs...`)

---

## Step 3: Set Environment Variable in Railway (1 min)

1. Open your Railway project dashboard
2. Click your service
3. Go to **Variables** tab
4. Click **New Variable**
5. Set:
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: `<paste service_role key here>`
6. Click **Add**
7. Railway will auto-deploy

---

## Step 4: Verify (1 min)

Wait 30 seconds for deployment, then test:

```bash
# Replace with your Railway URL
curl https://potomac-analyst-workbench-production.up.railway.app/health/db
```

Look for:
```json
{
  "status": "healthy",
  "database": {
    "using_service_role": true
  },
  "tables": {
    "afl_history": {"exists": true, "accessible": true}
  }
}
```

---

## ✅ Done!

All 3 issues are now fixed:
- ✅ `afl_history` table exists
- ✅ Service role key configured
- ✅ Better error logging

Next time you generate AFL code, check logs - you should see:
```
INFO: AFL history saved successfully
```

Instead of:
```
WARNING: Failed to save AFL history: table not found
```
