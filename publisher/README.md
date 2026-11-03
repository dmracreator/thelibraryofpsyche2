# Psyche shelf publishing service

This Worker signs in the GitHub account `dmracreator` through a private GitHub App. It can update only `books.js` on `dmracreator/thelibraryofpsyche2`, branch `main`. The app should be installed on this repository only, with Contents read/write and Metadata read access. No account permissions or webhooks are needed. Repository ID: 1443323037.

Secrets (Cloudflare Worker settings, never GitHub):
- GITHUB_CLIENT_ID: GitHub App client ID
- GITHUB_CLIENT_SECRET: GitHub App OAuth client secret
- SESSION_SECRET: cryptographically random 32-byte-or-longer value

Register the app callback as `https://YOUR-WORKER.workers.dev/callback`. Homepage: https://thelibraryofpsyche.com. Expiring user access tokens should remain enabled. The Worker uses OAuth state, PKCE, an encrypted HttpOnly ten-minute flow cookie, owner allowlisting, and encrypted one-hour publishing sessions. The GitHub token never appears in the public frontend or response body. The encrypted session is held only in the editor tab’s session storage; sign-out clears it. Publishing requires a matching file SHA to avoid overwriting concurrent changes. Authentication data is not logged. Worker request observability is disabled to avoid logging OAuth callback query strings.

Set the Worker URL in the website’s `publisher-config.js` after deployment. Publish only through HTTPS. The website’s origin is pinned to https://thelibraryofpsyche.com; requests from other origins are rejected. Uploaded book covers are part of the shelf data and travel through Cloudflare to GitHub when publishing. The Worker validates and reconstructs book fields; it does not execute uploaded JavaScript. It cannot change arbitrary repository files or branches.
