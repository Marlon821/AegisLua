# AegisLua

Scalable Vercel-hosted Lua authentication and script licensing platform.

This is designed to manage any number of scripts, licenses, Roblox users, and device/HWID bindings from one dashboard.

## Product Model

- **Scripts**: products or loaders people can buy access to.
- **Licenses**: generated keys that grant access to one or more scripts.
- **Users**: Roblox user IDs that redeem/use a license.
- **Devices**: hashed HWID/device fingerprints bound to a license.
- **Logs**: every allowed or denied validation attempt.

## Connect GitHub, Codex, and Vercel

This folder is a local git repo. Add your GitHub repo as `origin`, commit, then push:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git add .
git commit -m "Add AegisLua dashboard"
git push -u origin master
```

Then import the GitHub repo in Vercel.

## Environment

For local development, use `.env.local`. Do not rename `.env.example`; it is only a template.

Local testing can run without KV because the app falls back to `.data/local-store.json` when `KV_REST_API_URL` and `KV_REST_API_TOKEN` are missing outside production.

Local `.env.local`:

```text
DEVICE_HASH_SALT=local-dev-device-salt-change-before-production
CLAIM_SECRET=local-dev-claim-secret-change-before-production
LOCAL_KV_FALLBACK=true
```

For Vercel production, set these:

```text
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-kv-rest-token
DEVICE_HASH_SALT=change-this-random-device-hash-salt
CLAIM_SECRET=change-this-random-claim-signing-secret
RESEND_API_KEY=
EMAIL_FROM=AegisLua <noreply@your-domain.com>
LOCAL_KV_FALLBACK=false
```

Use Vercel KV or Upstash Redis for the KV REST values. `RESEND_API_KEY` and `EMAIL_FROM` are optional locally, but production password reset emails need an email provider.

## Admin Panel

Open the deployed site and create the first account.

The first signup becomes the owner account. Later signups become customer accounts.

Current features:

- Upload/paste Lua source and create protected loader URLs
- Enable or disable scripts
- Create licenses for selected scripts
- Set max Roblox users per license
- Set max devices/HWIDs per license
- Reset devices for a license
- Revoke or delete licenses
- View recent validation logs
- Create LootLabs ad systems that deliver existing keys
- Track claim redemptions and denied claim attempts

## Ad Systems

Ad systems are designed for LootLabs monetized redirect flows:

1. Upload or paste Lua source in Scripts to create a protected loader.
2. Create or generate a key in Key Management or Auto Key Gen.
3. Create an ad system, select the script, and paste that existing key into the delivery key field.
4. Paste your LootLabs API key and choose tier, theme, and task count.
5. Copy the generated LootLabs URL.
6. After the provider redirects the user back, AegisLua validates the signed ticket and shows the attached existing key.

The raw license key is never placed in the monetized URL. AegisLua stores the delivery key encrypted so it can show that same existing key after redemption.

LootLabs link creation uses `POST https://creators.lootlabs.gg/api/public/content_locker` with your API key. The generated LootLabs URL points back to AegisLua's signed claim page.

## Protected Loader Flow

Scripts are stored encrypted server-side. The dashboard gives you a loader like:

```lua
loadstring(game:HttpGet("https://YOUR-DOMAIN.vercel.app/api/loader/your-script-id"))()
```

The loader shows a small key prompt, validates the key through AegisLua, and only returns the protected source after the key, user, and HWID checks pass.

This is a practical first layer, not magic. A determined attacker can still inspect client-side code after it is delivered. For a paid production obfuscation product, add a real Lua obfuscation transform before encryption and consider per-request watermarks.

## Lua Validation API

Endpoint:

```text
POST https://YOUR-DOMAIN.vercel.app/api/auth/validate
```

Payload:

```json
{
  "scriptId": "your-script-id",
  "key": "LICENSE_KEY",
  "userId": "123456",
  "username": "RobloxName",
  "placeId": "123",
  "deviceId": "executor-or-loader-device-id"
}
```

Response:

```json
{
  "ok": true,
  "reason": "ok",
  "role": "customer",
  "script": {
    "id": "...",
    "slug": "your-script-id",
    "name": "Your Script"
  },
  "license": {
    "id": "...",
    "expiresAt": null,
    "maxDevices": 1
  }
}
```

Example Luau shape:

```lua
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local API_URL = "https://YOUR-DOMAIN.vercel.app/api/auth/validate"
local SCRIPT_ID = "your-script-id"

local function getDeviceId()
	if gethwid then
		return gethwid()
	end
	if identifyexecutor then
		local name, version = identifyexecutor()
		return tostring(name) .. ":" .. tostring(version)
	end
	return "missing-device-id"
end

local function validateKey(key)
	local player = Players.LocalPlayer
	local response = game:HttpPost(
		API_URL,
		HttpService:JSONEncode({
			scriptId = SCRIPT_ID,
			key = key,
			userId = player.UserId,
			username = player.Name,
			placeId = game.PlaceId,
			deviceId = getDeviceId(),
		}),
		"application/json"
	)

	local data = HttpService:JSONDecode(response)
	return data.ok == true, data.reason, data
end
```

## Security Notes

- Raw license keys are not stored, only SHA-256 hashes.
- Raw device IDs are not stored, only salted SHA-256 hashes.
- User passwords are not stored, only salted `scrypt` password hashes.
- Sessions use HTTP-only cookies and store only hashed session tokens server-side.
- Password reset links are one-time use and expire after 30 minutes.
- The client can still be tampered with, so keep secrets on the server only.
- For paid public use, add rate limiting, payment webhooks, email verification, bot protection, and optional 2FA.

## Auth Model

The current app uses custom email/password auth:

- Signup creates a user account.
- The first user becomes `owner`.
- Later users become `customer`.
- Passwords are hashed with Node `scrypt`.
- API routes check the HTTP-only session cookie.
- Password resets can send through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.

Large companies usually avoid building every security piece themselves. They use managed auth providers such as Clerk, Auth0, WorkOS, Supabase Auth, or Cognito, plus database-backed roles and audit logs. This custom auth is good for an early product, but a payment-ready public launch should still add email verification, rate limits, bot protection, and optional 2FA.
