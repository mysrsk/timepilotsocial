# TimePilot Social

TimePilot Social is a multi-tenant social-media scheduling application for planning, drafting, organizing, and publishing content across X, Instagram, LinkedIn, and Facebook. The product persists schedules as UTC instants while retaining the creator-selected IANA timezone, so daylight-saving adjustments are calculated automatically.

## Product capabilities

The application includes an elegant public landing page, authenticated workspace, native account connection foundation, rich composer with media uploads and platform guidance, drafts, calendar and queue views, rescheduling controls, platform summaries, notifications, and a user-scoped data model. Its scheduler uses guarded job claiming so a post cannot be published twice by concurrent job attempts.

## Technology

The project uses React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL-compatible storage, Manus OAuth, and S3-backed media storage.

## Local development

Install dependencies and use the standard scripts:

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

Schema changes must be generated using `pnpm drizzle-kit generate`, reviewed in `drizzle/`, and then applied using the managed database migration workflow.

## Native platform authorization

The repository contains secure foundations for OAuth state, PKCE (where required), encrypted access/refresh-token persistence, callback processing, expiry-aware token refresh, and provider-specific publishing boundaries. Live connections require the following secrets in the deployment environment:

| Provider | Required variables |
| --- | --- |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` |
| Meta / Instagram / Facebook | `META_APP_ID`, `META_APP_SECRET` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Shared security | `SOCIAL_TOKEN_ENCRYPTION_KEY` (base64 32-byte key), `SOCIAL_OAUTH_REDIRECT_ORIGIN` |

Register every redirect URI at the relevant provider using this shape:

```text
https://YOUR-DOMAIN.com/api/social/oauth/callback/{x|instagram|linkedin|facebook}
```

Do not commit credentials. Environment files are excluded through `.gitignore`.

## Production launch checklist

Configure the native OAuth secrets, complete each platform's production review and publishing permissions, publish the app, and then connect the production domain in the hosting settings. Update `SOCIAL_OAUTH_REDIRECT_ORIGIN` to the final HTTPS domain before authorizing user accounts.

## Validation

The test suite covers timezone resolution, user ownership boundaries, scheduler lifecycle behavior, native token encryption, OAuth URL construction, and publishing adapter validation.
