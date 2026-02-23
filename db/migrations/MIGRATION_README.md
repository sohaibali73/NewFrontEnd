# Database Migration Guide: Supabase Auth Integration

This migration rebuilds the authentication infrastructure to use Supabase's built-in authentication system with proper encryption for sensitive data.

## What Changed

### Before
- Custom `users` table with plain text password hashes (SHA256 with hardcoded salt)
- API keys stored in plain text
- Custom JWT token generation
- RLS policies referencing `auth.uid()` but data in custom table

### After
- **Supabase Auth** (`auth.users`) for authentication
- **AES-256-GCM encryption** for API keys at rest
- **Supabase JWT tokens** with proper validation
- **Proper RLS policies** using `auth.uid()`
- **TLS/SSL encryption** in transit (handled by Supabase)

## Migration Steps

### 1. Generate an Encryption Key

Run this command to generate a secure 32-byte encryption key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Update Environment Variables

Add these variables to your `.env` file:

```env
# Supabase Configuration (existing)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Data Encryption at Rest (NEW - required)
ENCRYPTION_KEY=your-generated-encryption-key

# Admin Configuration (existing)
ADMIN_EMAILS=sohaib.ali@potomac.com,admin@example.com
```

### 3. Run the Migration

Execute the migration SQL in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `db/migrations/010_supabase_auth_migration.sql`

### 4. Configure Supabase Auth

In Supabase Dashboard:

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set up email confirmation settings

### 5. Update Frontend

Update your frontend to use Supabase Auth client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      name: 'User Name',
    }
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Sign out
await supabase.auth.signOut()
```

## User Migration

**Important:** Passwords cannot be migrated from the old system because:
1. Old system used weak SHA256 hashing with hardcoded salt
2. Supabase Auth uses bcrypt which is incompatible

Users will need to:
1. Use "Forgot Password" to reset their password, OR
2. Re-register with a new account

The migration script will:
- Create `user_profiles` entries for existing users in `auth.users`
- Preserve user metadata (name, nickname, is_admin)
- NOT migrate passwords

## API Changes

### Authentication Endpoints

| Endpoint | Changes |
|----------|---------|
| `POST /auth/register` | Now uses Supabase Auth |
| `POST /auth/login` | Now uses Supabase Auth |
| `POST /auth/logout` | Now uses Supabase Auth |
| `POST /auth/forgot-password` | Now uses Supabase's built-in reset |
| `POST /auth/reset-password` | Now uses Supabase's recovery flow |
| `PUT /auth/api-keys` | Now encrypts keys with AES-256-GCM |
| `GET /auth/me` | Returns user from `user_profiles` |

### Token Validation

All protected routes now validate tokens using Supabase Auth:

```python
from api.dependencies import get_current_user_id, get_current_user

@router.get("/protected")
async def protected_route(user_id: str = Depends(get_current_user_id)):
    # user_id is validated against Supabase Auth
    return {"user_id": user_id}
```

## Security Features

### Encryption at Rest
- API keys are encrypted using AES-256-GCM
- Encryption key is stored server-side (environment variable)
- Keys are decrypted on-demand when needed

### Encryption in Transit
- All Supabase connections use TLS/SSL
- JWT tokens are transmitted over HTTPS

### Password Security
- Supabase Auth uses bcrypt for password hashing
- Passwords are never stored in your database
- Password policies can be configured in Supabase Dashboard

### Row Level Security
- All tables have RLS enabled
- Policies use `auth.uid()` for proper user isolation
- Service role bypasses RLS for backend operations

## Troubleshooting

### "Encryption key not configured"
Make sure `ENCRYPTION_KEY` is set in your environment variables.

### "Invalid or expired token"
- Token may have expired (default: 1 hour)
- User may need to log in again
- Check that the correct Supabase URL and keys are configured

### "User not found"
- User may exist in old `users` table but not in `auth.users`
- User needs to register or reset password

### RLS Policy Errors
- Ensure service role key is being used for backend operations
- Check that `auth.uid()` returns the expected user ID

## Rollback

If you need to rollback:

1. Keep the old `users` table (don't drop it)
2. Revert auth routes to previous version
3. Update dependencies to use old token validation

```sql
-- The migration does NOT automatically drop the users table
-- Uncomment this only after verifying the migration is successful:
-- DROP TABLE IF EXISTS users CASCADE;
```

## Files Changed

- `db/migrations/010_supabase_auth_migration.sql` - New migration
- `api/routes/auth.py` - Rewritten for Supabase Auth
- `api/dependencies.py` - Updated token validation
- `api/routes/admin.py` - Updated to use `user_profiles`
- `config.py` - Added `encryption_key` setting