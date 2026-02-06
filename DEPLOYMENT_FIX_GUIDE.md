# 🚀 Deployment Fix Guide - Server Log Debug Issues

This guide walks you through fixing the 3 critical issues identified in your server logs.

---

## 📋 Issues Summary

1. **Missing `afl_history` table** - 404 errors when saving AFL generation history
2. **RLS Policy Configuration** - Using anon key instead of service_role key
3. **Reverse Engineer Route Timing** - Minor frontend/backend HTTP method mismatch

---

## 🔧 Fix 1: Run Database Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/vekcfcmstpnxubxsaano
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fixed Migration

Copy and paste the contents of `db/migrations/004_history_tables_FIXED.sql` into the SQL Editor and click **RUN**.

This will create:
- ✅ `afl_history` table with proper UUID foreign keys
- ✅ `reverse_engineer_history` table
- ✅ JWT-based RLS policies that work with service_role key
- ✅ Proper indexes for performance

### Step 3: Verify Tables Were Created

Run this verification query in SQL Editor:

```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('afl_history', 'reverse_engineer_history');
```

You should see both tables listed.

---

## 🔑 Fix 2: Configure Service Role Key

### Why This Matters

Your backend is currently using the **anon/publishable key** which is subject to Row Level Security (RLS) policies. This causes permission issues when inserting data.

The **service_role key** bypasses RLS and is the correct choice for backend operations.

### Step 1: Get Your Service Role Key

1. Go to Supabase Dashboard → **Settings** → **API**
2. Scroll to **Project API keys**
3. Copy the `service_role` key (⚠️ **NEVER** expose this to the frontend)

### Step 2: Set Environment Variable

**For Railway (Production):**

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add new variable:
   - **Name:** `SUPABASE_SERVICE_KEY`
   - **Value:** `<paste your service_role key here>`
5. Click **Deploy** to restart with new environment variable

**For Local Development:**

Create/update `.env` file in project root:

```bash
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

(Replace with your actual service_role key)

### Step 3: Verify Configuration

After deploying, test the health endpoint:

```bash
curl https://your-api-url.railway.app/health/config
```

Look for:
```json
{
  "supabase": {
    "service_key_configured": true  // Should be true now!
  }
}
```

---

## 🩺 Fix 3: Verify with Health Endpoints

### Test Database Connectivity

```bash
# Check overall health
curl https://your-api-url.railway.app/health

# Check database tables
curl https://your-api-url.railway.app/health/db

# Check which migrations are applied
curl https://your-api-url.railway.app/health/migrations
```

### Expected Output

The `/health/db` endpoint should show:

```json
{
  "status": "healthy",
  "database": {
    "using_service_role": true
  },
  "tables": {
    "afl_history": {
      "exists": true,
      "accessible": true
    },
    "reverse_engineer_history": {
      "exists": true,
      "accessible": true
    }
  }
}
```

---

## 🐛 Fix 4: Frontend Route Fix (Optional)

### Issue

The logs show:
```
POST /reverse-engineer/schematic/{id} HTTP/1.1" 404 Not Found
```

This suggests the frontend might be calling a non-existent route or using the wrong HTTP method.

### Solution

Verify in your frontend code that you're calling:
- ✅ `POST /reverse-engineer/schematic/{strategy_id}` (correct)
- ❌ `GET /reverse-engineer/schematic/{strategy_id}` (does not exist)

The backend only has a POST endpoint for generating schematics.

---

## 🧪 Testing the Fixes

### 1. Test AFL Generation with History

```bash
curl -X POST https://your-api-url.railway.app/afl/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Test strategy",
    "strategy_type": "standalone"
  }'
```

Check the server logs - you should now see:
```
INFO: AFL history saved successfully for user <user_id>
```

Instead of:
```
WARNING: Failed to save AFL history: table not found
```

### 2. Test Reverse Engineer History

After generating a strategy with reverse engineer, check logs for:
```
INFO: Reverse engineer history saved successfully for user <user_id>
```

### 3. Monitor Server Logs

Watch for these improved error messages:

**Before:**
```
WARNING - Failed to save AFL history: {'message': "Could not find the table..."}
```

**After (if table still missing):**
```
ERROR - afl_history table not found in database. Run migration 004_history_tables_FIXED.sql in Supabase.
```

---

## 📊 Monitoring & Debugging

### Check Server Logs in Railway

```bash
railway logs
```

Look for:
- ✅ `Using Supabase service_role key (bypasses RLS)`
- ✅ `AFL history saved successfully`
- ✅ `Reverse engineer history saved successfully`

### Use Health Endpoints

Add these to your monitoring/alerting:

- `GET /health` - Basic health check (200 = healthy)
- `GET /health/db` - Database connectivity and table status
- `GET /health/config` - Configuration validation
- `GET /health/migrations` - Migration status

---

## 🔒 Security Notes

### Service Role Key Security

⚠️ **CRITICAL:** The service_role key has full database access!

**DO:**
- ✅ Store in environment variables only
- ✅ Use only in backend/server-side code
- ✅ Keep in `.env` file (add to `.gitignore`)
- ✅ Use Railway environment variables for production

**DON'T:**
- ❌ Commit to git
- ❌ Expose to frontend/client-side code
- ❌ Share in public documentation
- ❌ Include in frontend build

---

## 📝 Checklist

Complete these steps in order:

- [ ] Run `004_history_tables_FIXED.sql` in Supabase SQL Editor
- [ ] Verify tables created with verification query
- [ ] Get service_role key from Supabase Dashboard
- [ ] Add `SUPABASE_SERVICE_KEY` to Railway environment variables
- [ ] Deploy/restart your Railway service
- [ ] Test `/health/config` endpoint (service_key_configured should be true)
- [ ] Test `/health/db` endpoint (all tables should be accessible)
- [ ] Test AFL generation and check logs for success message
- [ ] Monitor logs for 24 hours to ensure no more history save errors

---

## 🆘 Troubleshooting

### "Table still not found" after running migration

1. Check you ran the migration in the correct Supabase project
2. Verify with: `SELECT * FROM afl_history LIMIT 1;`
3. Check table owner and permissions

### "Still using anon key" after setting service_role key

1. Ensure variable name is exactly `SUPABASE_SERVICE_KEY`
2. Restart the Railway service after adding variable
3. Check logs for "Using Supabase service_role key" message
4. Verify with `/health/config` endpoint

### "Foreign key constraint violation"

This means the user_id doesn't exist in the users table. Ensure:
1. User is properly authenticated
2. User record exists in `users` table
3. user_id is a valid UUID

---

## 📞 Support

If issues persist after following this guide:

1. Check Railway logs for specific error messages
2. Test each health endpoint and share results
3. Verify Supabase project is accessible
4. Check all environment variables are set correctly

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ No more "table not found" errors in logs
2. ✅ AFL history saves successfully (check logs)
3. ✅ Reverse engineer history saves successfully
4. ✅ `/health/db` shows all tables as accessible
5. ✅ Logs show "Using Supabase service_role key"

**Expected log output after fixes:**
```
INFO - Using Supabase service_role key (bypasses RLS)
INFO - AFL history saved successfully for user 77233f03-8b86-42a4-8950-be61fb0d756e
INFO - Reverse engineer history saved successfully for user 77233f03-8b86-42a4-8950-be61fb0d756e
```

---

## 🎉 You're Done!

All server log issues should now be resolved. The application will:
- Save AFL generation history successfully
- Save reverse engineer session history
- Use proper service_role authentication
- Provide detailed health diagnostics

Happy coding! 🚀
