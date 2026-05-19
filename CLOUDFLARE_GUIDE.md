# Cloudflare Workers Deployment & Environment Variables Guide

This guide details how to manage your production deployment pipeline, environment variables, and secrets securely using **Cloudflare Workers**, **GitHub Actions**, and **Wrangler**.

---

## 🔐 1. GitHub Secrets Setup (For CI/CD)

To allow GitHub Actions to build and deploy your portfolio automatically, you must add the following **Repository Secrets** in your GitHub project settings (`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`):

| Secret Name | Description | How to obtain |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | An API token with Workers permissions. | Cloudflare Dashboard -> **My Profile** -> **API Tokens** -> **Create Token** -> Use the **Edit Cloudflare Workers** template. Ensure you add permissions for Workers Assets edit. |
| `CLOUDFLARE_ACCOUNT_ID` | Your unique Cloudflare Account ID. | Available on your Cloudflare Dashboard homepage sidebar (a 32-character hex string). |

---

## ⚡ 2. Environment Variables & Secrets in Cloudflare Workers

Since this is an **Assets-only Worker** (compiled static application), your environment variables are handled in two different contexts depending on where they are read:

### Context A: Build-time Variables (Vite / Client-Side)
If your React code needs to read configuration variables at runtime (e.g. Supabase credentials, API URLs), they must be prefixed with `VITE_` and injected **during the build process** in GitHub Actions.

1. **In your React code:**
   ```typescript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   ```
2. **In your GitHub Repository Secrets:**
   Add `VITE_SUPABASE_URL` as a secret.
3. **In `.github/workflows/deploy.yml`:**
   Inject the variable into the `Build Application` step:
   ```yaml
   - name: Build Application
     run: npm run build
     env:
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
   ```

---

### Context B: Runtime Workers Secrets (Server-Side)
If you decide to add a custom Worker script (`main = "src/worker.ts"`) in the future to execute server-side Node.js/JavaScript, you can define secrets and variables that are fetched dynamically on the server:

#### 1. Public Variables (Defined in `wrangler.toml`)
For non-sensitive variables, add a `[vars]` block at the bottom of your [wrangler.toml](file:///Users/mantt/Documents/OBN/new/portfolio/wrangler.toml):
```toml
[vars]
API_URL = "https://api.myportfolio.com"
ENVIRONMENT = "production"
```
In your Worker script, these are accessible via the `env` parameter:
```typescript
export default {
  async fetch(request, env) {
    const apiUrl = env.API_URL;
    return new Response(`Connected to ${apiUrl}`);
  }
}
```

#### 2. Sensitive Secrets (Wrangler / Dashboard Secrets)
For passwords, private keys, or credentials that should never be checked into git:
*   **Locally (via CLI):**
    ```bash
    npx wrangler secret put MY_SECRET_API_KEY
    ```
    *(Wrangler will prompt you to enter the secret value securely)*
*   **On the Cloudflare Dashboard:**
    Go to **Workers & Pages** -> Select your Worker (`portfolio`) -> **Settings** -> **Variables** -> Click **Add Variable** under **Environment Variables** and check **Encrypt/Secret**.

---

## 🚀 3. Manual Steps Required After Code Changes

1. **Delete any active GitHub repository auto-build configurations** inside the Cloudflare Dashboard:
   * Go to **Workers & Pages** -> select your project -> **Settings** -> **Builds & Deployments** -> click **Pause/Disconnect deployments** under the Git integration section.
   * *Why?* This prevents Cloudflare from running its broken auto-build and delegates 100% of the deployment authority to your new GitHub Action.
2. **Add the Repository Secrets** (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) to your GitHub project as explained in Section 1.
3. **Push to the `deployment` branch** to trigger the pipeline!
