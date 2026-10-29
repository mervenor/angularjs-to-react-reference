# AngularJS to React: a reference migration

A complete, step-by-step migration of [angular-phonecat](https://github.com/angular/angular-phonecat),
the official AngularJS 1.x tutorial app, to React and TypeScript.

- **Incremental, not a rewrite.** AngularJS and React ran side by side, one screen moving at a time,
  until AngularJS had nothing left to do (the "strangler" approach).
- **Behaviour first.** Before changing anything we wrote characterisation tests against the
  original app. They stayed green at every step; the only edits to them were the URL format (step 4)
  and one deliberate markup fix (step 5).
- **Every step is a tag.** Check out `step-0` to `step-6` and see exactly what changed and why.

The step-by-step guide, including what broke and the trade-offs, is in [MIGRATION.md](MIGRATION.md).

## Who this is for

- Teams still running AngularJS 1.x (out of support since the end of 2021) who need a way off it
  that does not stop feature work for months.
- Engineering managers who want to see what a low-risk migration looks like before agreeing to one.
- Developers who want a small, complete example of the techniques: characterisation tests, a
  React-in-AngularJS bridge, recording a framework's behaviour as an "oracle", and redirecting old
  hash URLs.

## The steps

| Tag | What happens | Unit tests | Browser tests |
| --- | --- | ---: | ---: |
| `upstream` | The original app, imported unchanged (upstream commit `ef6f6eb`, 2020-06-05) | 5 (Karma, not run) | 7 (Protractor, not run) |
| `step-0` | Inventory; characterisation tests and the AngularJS "oracle" against the original app | 25 | 21 |
| `step-1` | Vite + React + TypeScript build serving the unchanged AngularJS app; React-in-AngularJS bridge | 28 | 21 |
| `step-2` | Phone list migrated to React; typed data layer; search ported and checked against the oracle | 75 | 21 |
| `step-3` | Phone detail page migrated to React | 80 | 21 |
| `step-4` | AngularJS routing replaced by React Router; clean URLs; old `#!` URLs redirected | 91 | 25 |
| `step-5` | AngularJS and its dependencies removed; Bootstrap replaced; accessibility pass | 87 | 29 |
| `step-6` | Final checks, CI workflow, before/after numbers | 87 | 29 |

Unit tests run in Vitest with jsdom and Testing Library. Browser tests run in Playwright with
real Chromium against the production build (step 0: against the original app as served upstream).

## Run it

Requires Node.js 22.22 or later.

```bash
git checkout step-6            # or any step-N tag
npm ci
npx playwright install chromium   # once, for the browser tests

npm run dev                    # http://localhost:8000/ (step 0: npm start, then /index.html)
npm run check                  # type-check, lint, unit tests, build, browser tests
```

`npm run check` at step 0 runs type-check, unit tests and browser tests (there is no build or lint
yet). To see what a step changed: `git diff step-2 step-3 --stat`, then `git show step-3`.

## Before and after

"Before" is the upstream app as imported at the `upstream` tag. "After" is `step-6`.

| Measure | Before (AngularJS 1.8) | After (React 19 + TypeScript) |
| --- | ---: | ---: |
| Automated tests | 12 (5 unit, 7 end-to-end), on deprecated tools | 116 (87 unit, 29 browser) |
| Direct runtime dependencies | 6 | 3 |
| Installed packages (including dev tools) | 556 | 382 |
| Known vulnerabilities (`npm audit`, 2026-10-29) | 71 (18 critical); 3 in runtime packages | 0 |
| JavaScript, minified and gzipped | 108.5 kB (+1.2 kB templates) | 82.3 kB |
| CSS, minified and gzipped | 20.5 kB | 1.0 kB |
| JavaScript the browser downloads (upstream served unminified, uncompressed files) | 1,891 kB | 264 kB (about 83 kB compressed) |
| Accessibility problems found by axe (WCAG 2.1 A/AA + best practice) | 9 rules (list 5, detail 4) | 0 |
| App code, lines (excluding data, images, libraries, tests) | 425 (121 JS, 173 HTML, 131 CSS) | 609 (378 TS/TSX, 219 CSS, 12 HTML) |
| Test code, lines | 153 | 479 |
| Static types | none | strict TypeScript |

Notes, so the numbers are not oversold:

- The app code grew. The React version has types, loading and error states, accessibility
  fixes, and about 125 lines of CSS that replace the parts of Bootstrap the app used. Fewer lines
  was never the goal.
- The JavaScript saving is modest (about a quarter): React and React DOM alone are about 69 kB gzipped. Most of
  the total saving comes from dropping Bootstrap's 120 kB stylesheet, and the upstream setup served
  unminified files, which no production build should.
- During the migration the JavaScript peaked at 178.7 kB gzipped (steps 2 and 3, when AngularJS,
  jQuery and React all loaded). See the step 6 section of [MIGRATION.md](MIGRATION.md).
- Vulnerability counts change as advisories are published; the date is the date we ran the audit.

How we measured: sizes are gzip level 9 of the built files (before: the `.min.js` builds of the
same library versions and `bootstrap.min.css`); "served" bytes and axe results come from loading
both versions in headless Chromium with Playwright and `@axe-core/playwright`; lines of code from
`cloc`; dependency and vulnerability counts from `npm audit` on each lockfile.

## Credits and licence

Based on [angular-phonecat](https://github.com/angular/angular-phonecat) by the AngularJS team,
MIT licence. The phone data and images are from that project. See [NOTICE](NOTICE).
This repository is MIT licensed; see [LICENSE](LICENSE).

---

Need this done on your app? Mervenor — hello@mervenor.com — https://mervenor.com
