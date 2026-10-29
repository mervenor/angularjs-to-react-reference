# AngularJS to React: a reference migration

A worked, step-by-step migration of [angular-phonecat](https://github.com/angular/angular-phonecat),
the official AngularJS 1.x tutorial app, to React and TypeScript. Both frameworks run side by side
until AngularJS is removed, and the same behaviour tests stay green at every step.

**You are looking at step 0.** The app is still the original AngularJS app; this step adds the tests
that describe what it does. See [MIGRATION.md](MIGRATION.md) for the guide.

```bash
npm install
npx playwright install chromium   # once, for the browser tests
npm start                         # http://localhost:8000/index.html
npm test                          # unit tests (Vitest + jsdom)
npm run test:e2e                  # characterisation tests (Playwright, real Chromium)
```

Need this done on your app? Mervenor — hello@mervenor.com — https://mervenor.com

Licence: MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
