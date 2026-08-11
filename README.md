# FashionHub E2E Test Suite

Playwright + TypeScript end-to-end tests for the [FashionHub](https://pocketaces2.github.io/fashionhub/) demo site. The suite runs cross-browser (Chromium, Firefox, WebKit) against three environments — local, staging, production — picked via CLI or config file.

There's also one bonus test (`test-case4`) that scrapes a GitHub repo's open pull requests to CSV. It's unrelated to FashionHub itself — see [Test cases](#test-cases) for why it's scoped differently from the rest.

## Prerequisites

- Node.js v22 or later
- npm
- Docker (only if you're running against the `local` environment)

## Setup

```bash
npm install
npx playwright install --with-deps
```

Run that second command once per machine (or CI runner) — `npm install` gets you the Playwright library, but the actual browser binaries (Chromium, Firefox, WebKit) it drives are a separate download.

## Running the app locally

The `local` environment expects the app at `http://localhost:4000/fashionhub/`, served from the provided Docker image:

```bash
docker run -p 4000:4000 pocketaces2/fashionhub-demo-app:latest
```

## Running the tests

```bash
npm test                # full suite, cross-browser, resolved environment
npm run test:local      # ENV=local
npm run test:staging    # ENV=staging
npm run test:production # ENV=production
```

A few other ways to run things:

```bash
npx playwright test tests/test-case2.spec.ts       # a single spec file
npx playwright test -g "login for demouser"         # a single test by name
npx playwright test --project=chromium               # a single browser
npx playwright show-report                           # open the last HTML report
```

## Environment configuration

`config/environments.ts` decides which environment you're testing against, checked in this order:

1. **CLI**: `ENV=staging npx playwright test`
2. **Config file**: `ENV=local` in `.env`
3. **Default**: falls back to `local` if neither is set

Set `ENV` to something that isn't one of the three below and it fails fast with an error, rather than quietly defaulting to `local`.

| Environment  | Base URL                                       |
| ------------ | ----------------------------------------------- |
| `local`      | `http://localhost:4000/fashionhub/`              |
| `staging`    | `https://staging-env/fashionhub/`                |
| `production` | `https://pocketaces2.github.io/fashionhub/`      |

## Type checking

```bash
npm run typecheck
```

Worth noting there's no separate build step for this project — Playwright Test transpiles `.ts` files on the fly when it runs them, so `typecheck` (`tsc --noEmit`) exists purely to catch type errors early, not to produce anything.

## Project structure

```
config/     environment + resolution logic used by playwright.config.ts
pages/      Page Object Model — one class per page, sharing pages/base.page.ts
fixtures/   custom Playwright fixtures, split by concern and merged in fixtures/base.ts
utils/      framework-agnostic helpers (link checking, CSV writing, PR crawling)
data/       shared TypeScript types for fixtures/pages/utils to import from
tests/      spec files
```

Specs pull `test`/`expect` from `fixtures/base.ts` rather than `@playwright/test` directly — that's what wires in the page objects and other fixtures.

## Test cases

| Spec | Covers |
| --- | --- |
| `test-case1.spec.ts` | Home and About pages load without unexpected console errors |
| `test-case2.spec.ts` | Every link on the home page resolves to a 2xx/3xx status |
| `test-case3.spec.ts` | Login flow with valid credentials |
| `test-case4.spec.ts` | Bonus: exports a GitHub repo's open PRs to CSV |

**Why `test-case4` only runs on Chromium:** the cross-browser requirement is really about making sure FashionHub itself renders and behaves consistently across engines. `test-case4` never touches FashionHub — it's scraping a GitHub search-results page, and that renders identically no matter which browser is driving it. Running it on all three projects would just triple the request load against GitHub's servers for no extra signal, and this scraper already tripped GitHub's secondary rate limit once during development, on a single browser. So `playwright.config.ts` excludes it from the `firefox` and `webkit` projects via `testIgnore`.

It scrapes `appwrite/appwrite` by default. To point it at a different repo, override the `repo` option fixture in the spec — `test.use({ repo: 'owner/name' })` — there's no CLI flag for this yet.

The CSV itself lands in Playwright's per-test output directory (`test-results/.../open-pulls.csv`) and gets attached to the HTML report too, so `npx playwright show-report` is the easiest way to grab it.
