# Vercel Environment Setup

Copy `.env.vercel.example` to `.env.vercel`, fill in the values, then import/paste those variables into Vercel.

Do not commit `.env.vercel`. It is ignored by Git because it contains secrets.

## Required Values

`NEXT_PUBLIC_APP_URL` and `APP_URL`

Use your deployed Vercel URL, for example:

```text
https://aegis-lua-one.vercel.app
```

`KV_REST_API_URL`

Use the Upstash Redis REST URL.

`KV_REST_API_TOKEN`

Use the Upstash Redis REST token, not the read-only token.

`DEVICE_HASH_SALT`

Use a long random string. This is used to hash device/HWID values.

`CLAIM_SECRET`

Use a different long random string. This signs ad claim tickets and encrypts stored secrets.

`OWNER_EMAIL`

Use the exact email address you will sign up/sign in with.

## Import Into Vercel

In Vercel:

1. Open the AegisLua project.
2. Go to Settings.
3. Go to Environment Variables.
4. Use Import/Paste if Vercel shows that option, then paste the contents of `.env.vercel`.
5. If there is no import option, add each key/value manually.
6. Save the variables for Production.
7. Redeploy the latest deployment.

## Claim Your Owner Account

1. Set `OWNER_EMAIL` in Vercel to your real email address.
2. Redeploy after saving the env var.
3. Go to `/login?mode=signup`.
4. Sign up with the exact same email used in `OWNER_EMAIL`.
5. After signup, open `/dashboard`.
6. You should see the owner-only `Users` tab.

If you already created an account before setting `OWNER_EMAIL`, just sign in again with that same email after redeploying. AegisLua will promote that account to owner automatically.
