# TimePilot Social Production Launch Runbook

This runbook covers the controlled release of TimePilot Social from its validated project checkpoint to the public HTTPS domain **`timepilotsocial.com`**. Complete the steps in order; do not authorize social accounts until the final production domain and OAuth redirect settings are in place.

## 1. Release baseline

Start from checkpoint `25f0d104`, which includes the product implementation, native OAuth foundation, database migrations, media workflow, and repository documentation. The complete source is exported to [mysrsk/timepilotsocial](https://github.com/mysrsk/timepilotsocial).

Before publishing, run the following commands locally or in the CI workflow that owns the release:

```bash
pnpm check
pnpm test
```

## 2. Configure production secrets

In the project management panel, open **Settings → Secrets** and add the secrets below. Keep all values out of GitHub and do not place them in browser-exposed `VITE_` variables.

| Variable | Purpose |
| --- | --- |
| `X_CLIENT_ID` and `X_CLIENT_SECRET` | Native X authorization and publishing access. |
| `META_APP_ID` and `META_APP_SECRET` | Instagram and Facebook authorization and publishing access. |
| `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` | LinkedIn authorization and publishing access. |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | A base64-encoded, 32-byte production key for the server-only social-token encryption layer. |
| `SOCIAL_OAUTH_REDIRECT_ORIGIN` | The exact final HTTPS origin: `https://timepilotsocial.com`. |

Use a separately managed production encryption key and retain it securely. Rotating this key without a planned migration prevents the application from decrypting existing social tokens.

## 3. Publish the application

From the project management header, select **Publish**. The previously saved checkpoint is required for this action. When a public platform URL is generated, open it in a private browser window and check that the public landing page, sign-in journey, and authenticated workspace load successfully.

> The production build can be published before a custom domain is connected. Do not begin social OAuth authorization until the final domain is active, because the authorization providers must receive the precise registered callback URL.

## 4. Connect `timepilotsocial.com`

Purchase `timepilotsocial.com` through your preferred registrar, then open **Settings → Domains** in the project management panel and bind the domain to the published application. The domain panel displays the exact DNS records required for the current deployment. Copy those records exactly into the registrar; do not substitute generic A, CNAME, or nameserver values from another host.

Wait until the domain panel reports that TLS and DNS verification are complete. Then confirm that both of these URLs resolve over HTTPS:

```text
https://timepilotsocial.com
https://www.timepilotsocial.com
```

Choose one canonical host and configure any available redirect option so the other host redirects to it.

## 5. Register native OAuth callbacks

In each provider’s developer console, set the production application origin to `https://timepilotsocial.com` and register the provider-specific callback URL below. Replace any temporary preview-domain callback URL before authorizing real user accounts.

| Platform | Production callback URL |
| --- | --- |
| X | `https://timepilotsocial.com/api/social/oauth/callback/x` |
| Instagram | `https://timepilotsocial.com/api/social/oauth/callback/instagram` |
| LinkedIn | `https://timepilotsocial.com/api/social/oauth/callback/linkedin` |
| Facebook | `https://timepilotsocial.com/api/social/oauth/callback/facebook` |

Complete the platforms’ production access, business verification, permission-review, privacy-policy, and data-deletion requirements before offering live publishing to customers. The app must remain in a limited or test mode until the relevant provider grants production access.

## 6. Post-launch acceptance checks

Use a separate test social account for the first connected platform and confirm the following end-to-end behavior:

| Check | Expected result |
| --- | --- |
| Account connection | The OAuth callback returns to the correct user workspace and records the connected account. |
| Draft and media upload | A draft and its media are visible only to the user who created them. |
| Time-zone conversion | Selecting `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`, `America/Anchorage`, or `Pacific/Honolulu` saves a UTC schedule and displays the correct local time. |
| DST behavior | A scheduled post remains tied to the chosen local time on both sides of a daylight-saving transition. |
| Publish lifecycle | The job claims the post once, records success or failure, and creates the relevant notification. |
| Public access | The landing page works at the canonical HTTPS custom domain with no insecure-content warning. |

## 7. Operational handover

Retain the repository, the production checkpoint, provider credentials, and DNS access in accounts controlled by the product owner. If a production release has to be reversed, use the project version history to restore the last known-good checkpoint, then investigate the affected provider integration before re-enabling scheduling.
