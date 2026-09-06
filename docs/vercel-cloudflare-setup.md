# Vercel website and Cloudflare enquiries

Vercel serves the Next.js static export. The Cloudflare Worker receives enquiries,
stores records and attachments in a private R2 bucket, checks Turnstile tokens,
and sends notifications through Resend. The browser uploads directly to the Worker.
No Vercel function or rewrite is needed for this setup.

## Current implementation and validation limits

- `vercel.json` selects `npm run build:web` for website builds.
- `wrangler.jsonc` deploys `server/enquiry-worker.ts` as `isculptures-interactive`.
- `npm run build:worker` validates and bundles the API without publishing it.
- The original `npm run build` remains available for combined Sites builds.
- The API remains unavailable until its runtime configuration is complete and
  `ENQUIRIES_ENABLED=true` is set explicitly.
- Tests use simulated storage, email and Turnstile responses. A passing build is
  not proof of a live connection or real mailbox delivery.

## 1. Cloudflare storage and deployment

In the account containing the existing `isculptures-interactive` Worker, create
the private R2 bucket `isculptures-enquiries`. If using another existing bucket,
update `bucket_name` in `wrangler.jsonc` first. Keep public access disabled.
The configuration binds that bucket to `ENQUIRIES`.

Cloudflare Workers Builds settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root path | `/` |
| Build command | `npm run build:worker` |
| Deploy command | `npx wrangler deploy` |
| Non-production command | `npx wrangler versions upload` |

Leave non-production branch deployments off until a separate test backend/bucket
is configured; preview versions otherwise use the same R2 binding. `versions upload`
does not promote a version to production. Do not include ordinary Vercel PR preview
hostnames in the production allowlist unless intentionally testing that preview.

Use the Worker URL Cloudflare actually assigns, not a guessed account subdomain.
`GET https://<assigned-worker-host>/api/enquiry` returns JSON; `/` returns 404 because
this Worker serves only the API. Before setup is complete, `available` is false.

## 2. Runtime variables and secrets

Under the Worker's **Settings > Variables and Secrets**, configure:

| Name | Type | Value |
| --- | --- | --- |
| `ENQUIRIES_ENABLED` | Variable | `false` during setup; `true` when ready to test |
| `ENQUIRY_ALLOWED_ORIGINS` | Variable | Exact approved website origins, separated by commas |
| `ENQUIRY_TO` | Variable | `info@isculptures.com.au` |
| `ENQUIRY_FROM` | Variable | Sender address on a domain verified by Resend |
| `TURNSTILE_SITE_KEY` | Variable | The widget's public site key |
| `TURNSTILE_SECRET` | Secret | The widget's secret key |
| `RESEND_API_KEY` | Secret | Sending key for the verified sender domain |
| `FILE_LINK_SECRET` | Secret | At least 32 cryptographically random bytes |
| `ENQUIRY_ADMIN_TOKEN` | Secret | A separate value of at least 32 random bytes |

For example, an allowlist may contain `https://your-project.vercel.app` and later
`https://isculptures.com.au,https://www.isculptures.com.au`. Replace example hosts
with verified project addresses. Include scheme and any port, with no path or
trailing slash. Wildcards, including `*.vercel.app`, are rejected. Local testing
can explicitly allow `http://localhost:3000`; never deploy development secrets.

The standalone Worker defaults to an empty allowlist and denies browser submissions.
It checks both the exact request origin and the Turnstile token's website hostname
and `enquiry` action. It does not trust forwarded-host headers. CORS is restricted
to the enquiry endpoint; administration still requires its bearer token.

`keep_vars: true` preserves dashboard-managed variables on subsequent Wrangler
deployments. Do not add secret values to the repository, build logs, or `NEXT_PUBLIC_`
variables. Local Wrangler secrets belong in the ignored `.dev.vars` file.

## 3. Turnstile and email

Create a Turnstile widget for the exact Vercel hostname used for testing. Add final
website hostnames only when ready for cutover. The widget runs on the website;
the Worker verifies the token against that website hostname, not its `workers.dev`
hostname. The form already loads the widget and requests action `enquiry`.

In Resend, verify a sender domain and create a sending API key. Enter the resulting
sender address and key in the Worker's runtime settings. Preserve existing mailbox
MX records while adding Resend verification records. Do not use a sender address
until its domain is verified. The existing email inbox alone is not a sending API.

## 4. Connect Vercel

Set the following Vercel environment variable for the intended environment:

```text
NEXT_PUBLIC_ENQUIRY_ENDPOINT=https://<assigned-worker-host>/api/enquiry
```

Redeploy Vercel after changing it: Next.js embeds this public endpoint at build
time. Leave `SITE_INDEXABLE=false` until the separately approved domain cutover.
Do not copy Cloudflare or Resend secrets into Vercel. Vercel hosts the website and
does not execute the repository's Cloudflare `functions/` directory.

Without this variable, the form uses `/api/enquiry` on the website domain and
shows its email fallback when no API is available. It never claims a submission
succeeded without confirmation from durable storage.

## 5. Verify before accepting enquiries

1. Confirm the deployed API reports `available: false` while disabled.
2. Configure all bindings, approved origins, widget and email credentials; enable
   enquiries for the agreed test.
3. Open the approved Vercel website and submit an owner-authorised test with a
   small STL file. Do not use customer information as test data.
4. Verify the displayed reference, stored record, studio notification and customer
   receipt. Open the signed download link and confirm the original file arrives.
5. Verify disallowed website origins are rejected and the private bucket remains
   inaccessible publicly. Configure a rate limit on POST `/api/enquiry` in Cloudflare.
6. If email delivery fails, use the authenticated recovery API and
   `npm run enquiries -- list` / `read <reference>` / `retry <reference>` as documented
   in the launch checklist. Run operational commands against the Worker origin.

Do not treat Vercel's successful deployment check as proof that the Cloudflare
backend is deployed or that real email delivery is functioning.

References: [Vercel environment variables](https://vercel.com/docs/environment-variables),
[Cloudflare R2 bindings](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/),
[Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
