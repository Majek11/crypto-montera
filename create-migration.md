# Standard Database Migration Process

## 1. Install Supabase CLI
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

## 2. Initialize Supabase in your project
```bash
supabase init
```

## 3. Link to your remote project
```bash
supabase link --project-ref qeuxyfuqpdajgfrelbiw
```

## 4. Create a new migration
```bash
supabase migration new add_profit_column_to_profiles
```

## 5. Edit the generated migration file
The CLI will create a file like `supabase/migrations/20240101000000_add_profit_column_to_profiles.sql`

Add your SQL:
```sql
-- Add profit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profit DECIMAL(20,2) NOT NULL DEFAULT 0;

-- Update existing users
UPDATE public.profiles 
SET profit = 0 
WHERE profit IS NULL;
```

## 6. Apply migration to remote database
```bash
supabase db push
```

## 7. Generate new TypeScript types
```bash
supabase gen types typescript --project-id qeuxyfuqpdajgfrelbiw > src/integrations/supabase/types.ts
```

## Benefits of this approach:
- ✅ Version controlled migrations
- ✅ Rollback capability
- ✅ Consistent across environments
- ✅ Team collaboration friendly
- ✅ Automatic type generation
- ✅ Production-safe deployments