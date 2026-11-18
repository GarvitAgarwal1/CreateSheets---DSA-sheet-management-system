# CreateSheets AI Crawler, SEO, And Sitemap Readiness

CreateSheets serves public crawler files at the root of `https://www.createsheets.com` and keeps private/auth/API areas out of search indexes.

## Final URLs

- `https://www.createsheets.com/robots.txt`
- `https://www.createsheets.com/llms.txt`
- `https://www.createsheets.com/llms-full.txt`
- `https://www.createsheets.com/sitemap.xml`
- `https://www.createsheets.com/sitemap-static.xml`
- `https://www.createsheets.com/sitemap-public-sheets.xml`

## Bot Policy

Production uses `robots-no-training.txt` as `public/robots.txt`.

- Allowed: `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `Googlebot`, `Bingbot`, `DuckDuckBot`.
- Blocked: `GPTBot`, `ClaudeBot`.
- `Google-Extended` is currently allowed.

This default lets AI search/user-request bots retrieve and cite public pages while opting out of OpenAI and Anthropic model-training crawlers. Robots rules are advisory and are not a security boundary; private data must remain protected by authentication and authorization.

## Public And Private URL Policy

- Canonical public discovery URL: `https://www.createsheets.com/explore`.
- Public sheet canonical URL: `https://www.createsheets.com/sheets/{username}/{sheetSlug}`.
- Legacy public sheet/profile URLs under `/profile/...` can still render, but `/profile` is blocked/noindexed and should not be submitted as canonical.
- Private/auth/API routes receive `noindex, nofollow` through frontend metadata and Nginx/Spring `X-Robots-Tag` headers where applicable.

## Switching To Maximum AI Training Visibility

If the product decision changes and public content may be used by training crawlers:

1. Replace `public/robots.txt` with the contents of `robots-allow-training.txt` from the AI bot pack.
2. Confirm `GPTBot` and `ClaudeBot` use `Allow: /`.
3. Rebuild and redeploy the frontend.
4. Re-check `https://www.createsheets.com/robots.txt` before submitting updated sitemaps.

## Verification Commands

```bash
curl -I https://www.createsheets.com/robots.txt
curl https://www.createsheets.com/robots.txt
curl -I https://www.createsheets.com/sitemap.xml
curl https://www.createsheets.com/sitemap.xml
curl -I https://www.createsheets.com/sitemap-static.xml
curl https://www.createsheets.com/sitemap-static.xml
curl -I https://www.createsheets.com/sitemap-public-sheets.xml
curl https://www.createsheets.com/sitemap-public-sheets.xml
curl -I https://www.createsheets.com/llms.txt
curl https://www.createsheets.com/llms.txt
curl -I https://www.createsheets.com/llms-full.txt
curl https://www.createsheets.com/llms-full.txt
curl -I http://createsheets.com
curl -I https://createsheets.com
curl -I https://www.createsheets.com/dashboard
curl -I https://www.createsheets.com/api/health
```

Expected highlights:

- `robots.txt`, `llms.txt`, and `llms-full.txt` return text content.
- `sitemap.xml`, `sitemap-static.xml`, and `sitemap-public-sheets.xml` return XML.
- non-www and HTTP redirect to `https://www.createsheets.com`.
- `/dashboard` and `/api/*` include `X-Robots-Tag: noindex, nofollow, nosnippet` at the Nginx layer.

## Manual Deployment Notes

- Deploy the frontend build so the files in `public/` land at the Nginx root.
- Deploy the Spring Boot backend so `GET /sitemap-public-sheets.xml` is available behind Nginx.
- Apply the updated `deploy/nginx-createsheets.conf` snippets to the active EC2 Nginx site config instead of replacing production blindly.
- Run `sudo nginx -t`, then reload Nginx.
- Submit `https://www.createsheets.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Current Limitation

CreateSheets is still a client-rendered React app. Public pages now have route metadata, JSON-LD, visible headings, and canonical links, but crawlers that do not execute JavaScript will not receive fully rendered sheet content in the initial HTML. A future SSR/prerender pass for `/`, `/explore`, and `/sheets/{username}/{sheetSlug}` would improve crawler reliability further.
