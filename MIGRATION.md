# Migrating angular-phonecat from AngularJS to React, step by step

This guide explains how we moved a small but real AngularJS 1.x app to React and TypeScript without
a "big bang" rewrite. Each step is a single commit with a tag (`step-0` to `step-6`), so you can
check out any step, run it, and diff it against the one before:

```bash
git diff step-1 step-2 --stat
git checkout step-3 && npm install && npm test && npm run test:e2e
```

The app is tiny on purpose. The method is the point: write down what the app does today, put the
new framework next to the old one, move one screen at a time, and only delete the old framework
when nothing uses it any more. On a large app the steps are the same; there are just more screens
in the middle.

## The rules we set ourselves

1. **Behaviour first.** Before changing anything we wrote tests that record what the original app
   does, quirks included. These are characterisation tests: they describe, they do not judge.
2. **Green at every step.** Every tag passes type-check, lint, unit tests and the browser tests.
3. **Change behaviour only on purpose.** When we did change behaviour (for example, a better error
   message, or clean URLs), the commit says so and the test change is visible in the diff.
4. **Small, reversible steps.** Each step can ship on its own. If a step goes wrong, you roll back
   one step, not the whole migration.

## Step 0: import, inventory, characterise

**Tag:** `step-0`. **What changed:** tests and tooling only; the app itself is untouched apart
from removing its old unit test files.

We imported the upstream files as they were at commit `ef6f6eb` (committed 2020-06-05, the last
commit on the main branch), without the upstream history, and tagged that import `upstream`. Every
later diff is against that.

### Inventory

| Area | What we found |
| --- | --- |
| Framework | AngularJS 1.8.0 (support ended at the end of 2021) with ngRoute, ngResource and ngAnimate |
| Modules | 5: `phonecatApp`, `core`, `core.phone`, `phoneList`, `phoneDetail` |
| Screens | 2 components: phone list (search, sort, links) and phone detail (specs, image gallery) |
| Services and filters | `Phone` (`$resource` over static JSON files), `checkmark` filter |
| Routing | `#!/phones` and `#!/phones/:phoneId`, anything else redirects to the list |
| Animation | CSS transitions on the list and between views (ngAnimate), a jQuery animation on the main image |
| Other runtime libraries | jQuery 3.3.1 (only for that animation), Bootstrap 3.3.7 (CSS grid only) |
| Data | 20 phones: one list file and one detail file per phone, plus 79 images |
| App code | 425 lines (121 JavaScript, 173 HTML templates, 131 CSS), excluding data and libraries |
| Tests | 5 Karma/Jasmine unit tests and 7 Protractor end-to-end tests |
| Dependencies | 15 direct, 556 installed; `npm audit` on the upstream lockfile reports 71 known vulnerabilities (18 critical), 3 of them in runtime packages |

### Why we did not keep the original tests

The original unit tests check controller internals, such as "`ctrl.orderProp` is `'age'`". Those
facts stop existing the moment a screen becomes a React component, so the tests could not guard the
migration. Karma is deprecated and Protractor reached end of life in 2023, so neither runs on
current tooling without effort. We kept the *scenarios* from the Protractor suite and rewrote them.

### What we test now

- **Browser tests (Playwright, real Chromium), `tests/e2e/characterisation.spec.ts`.** 21 tests
  covering routing (root, `index.html`, unknown routes, deep links, the back button), the list
  (count, default and alphabetical order, live search, links, images loading) and the detail page
  (every specification, tick and cross values, the image gallery, a phone with empty data). They
  only use what a user can see and the CSS classes the stylesheet already depends on, so they do not
  care which framework draws the page. The single framework-specific detail, the URL format, lives
  in one object at the top of the file.
- **The AngularJS oracle, `tests/unit/angularjs-oracle.test.ts`.** The list's search is
  `phones | filter:query | orderBy:sortKey`, and AngularJS's `filter` is subtler than it looks. We
  run the real AngularJS filters over the real data for 20 inputs and both sort orders, and record
  the results in `tests/fixtures/search-behaviour.json`. The React version must reproduce that file
  exactly.
- **Data contract, `tests/unit/data-contract.test.ts`.** The fields each screen reads, per phone.
  This is the evidence for the TypeScript types we write in step 2.

### Quirks we found and decided to keep

Writing the oracle surfaced behaviour that nobody would put in a specification but a user could
rely on:

- Search matches **every** field of a phone, not only the visible ones. "verizon" finds two phones
  whose names and descriptions never mention Verizon (it is in the hidden `carrier` field), and
  "jpg" matches all 20 phones because every phone has an image file name.
- A leading `!` negates the search: "!motorola" shows the 12 phones that do not match, and typing
  just "!" empties the list.
- "Alphabetical" sorting lowercases names and compares character codes. It is not the
  locale-aware sort most people would write by default, and the two disagree on some inputs.
- While the view changes, the old and new pages are both in the page for one second (the ngAnimate
  fade). Our tests wait for the right content rather than assuming an instant swap.

A migration is the wrong moment to "fix" these silently. We kept them all, and noted them as
candidates for a product decision after the migration.
