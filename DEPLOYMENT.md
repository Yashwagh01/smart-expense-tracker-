# Deploying Smart Expense to Vercel

Your project is fully configured and ready for 1-click deployment on **Vercel**.

---

## Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment with Supabase proxy & AI serverless routing"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New..."** → **"Project"**.
   - Select your repository and click **Import**.

3. **Configure Project Settings**:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).

4. **Environment Variables (Optional - defaults are already configured in code)**:
   If you wish to customize your Supabase instance, add:
   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://acemxzyszztshqyyitnf.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_aIwh2ER68ajiIwWJ9J7OTw_rbHffKU4` |

5. Click **"Deploy"**. Your app will build and be live in ~30 seconds!

---

## Method 2: Deploy via Vercel CLI

If you have the Vercel CLI installed:

```bash
# Login to Vercel
npx vercel login

# Deploy preview build
npx vercel

# Deploy directly to production
npx vercel --prod
```

---

## What `vercel.json` Configures Automatically

- **SPA History Navigation**: Any client route (e.g. `/analytics`, `/budgets`, `/owner`) automatically redirects to `/index.html` without 404 errors on page reload.
- **Supabase Cloud Proxy**: `/api/supabase/(.*)` rewrites to `https://acemxzyszztshqyyitnf.supabase.co/$1`, avoiding CORS/adblocker restrictions.
- **Python AI Serverless Functions**: Requests to `/api/ai/*` route directly into the serverless Python handler at `api/ai/index.py`.
