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

## Step 1: a modern build that still runs the old app

**Tag:** `step-1`. **What changed:** how the app is built and served, plus the bridge. No screen
has changed yet.

Before React can move in, the app needs a build that understands TypeScript, JSX and npm imports.
We chose Vite, and made it serve the *unchanged* AngularJS app first:

- The original JavaScript files moved to `src/legacy/` with `git mv`, so `git log --follow` still
  shows their history. Their contents did not change.
- Eleven `<script>` tags became one entry point, `src/main.ts`, which imports the libraries and
  the legacy files in the original order (`src/legacy/index.ts`).
- The data and images moved to `public/`, so they are served at the same paths as before.
- The HTML templates are imported as strings and put into AngularJS's template cache. The
  components still say `templateUrl`, so we did not have to edit them.
- `ng-app` became an explicit `angular.bootstrap(...)` call with `strictDi` switched on, which fails
  fast if anything relies on minification-unsafe injection.
- ESLint and TypeScript (strict mode) now run on all new code. The legacy JavaScript is excluded
  from linting on purpose: restyling code you are about to delete is wasted effort and noise in the
  diff.

### The ordering trap: jQuery before AngularJS

AngularJS uses jQuery instead of its built-in jqLite only if `window.jQuery` exists *at the moment
angular.js runs*. With script tags that was a matter of tag order. With modules, imports are
hoisted, so a line like `window.jQuery = jQuery` placed after the imports runs too late. The fix is
a tiny module, `src/legacy/jquery-global.ts`, imported first. Without it nothing fails loudly: the
image animation on the detail page just stops working. No test of ours would have caught that, so
we checked it by hand in the browser (`angular.element === window.jQuery`). On a large app, this
class of silent ordering bug is worth a dedicated smoke test.

### The bridge

`src/bridge/reactComponent.tsx` turns any React component into an AngularJS component:

```ts
angular.module('phoneList').component('phoneList', reactComponent(PhoneList));
```

AngularJS owns the element and its lifetime; React owns everything inside it. Bindings are passed
as props, changes are forwarded from AngularJS's `$onChanges`, and the React tree is unmounted in
`$onDestroy`. It is about 60 lines and has three unit tests. We wrote it ourselves rather than use
`react2angular`, which has not been updated since 2022 and expects `prop-types`.

The browser tests now run against the production build (`vite build` then `vite preview`), because
that is what users get.

**Tests:** 28 unit (3 new for the bridge), 21 browser. All green, unchanged.

## Step 2: the phone list becomes React

**Tag:** `step-2`. **What changed:** the list screen, a typed data layer, and the search logic.

The route template still says `<phone-list></phone-list>`. We registered a React component under
that same name through the bridge (`src/legacy/react-components.ts`) and deleted the AngularJS
component and its template. Nothing else in the AngularJS app had to know.

- **Types (`src/phones/types.ts`)** for the list and detail data, written from the data contract
  test in step 0 rather than from guesswork.
- **Data layer (`src/phones/api.ts`)**: `fetchPhones` and `fetchPhone` with `fetch` and request
  cancellation, replacing `$resource`. Same URLs. A failed request now throws a typed error.
- **Search and sort (`src/phones/search.ts`)**: a port of AngularJS's `filter` and `orderBy`
  for this use. It is checked against all 40 cases the AngularJS oracle recorded in step 0, and it
  matched first time only because we had written those cases down. A "sensible" rewrite that
  searched names only, or sorted with `localeCompare`, would have changed what users see.
- **The component (`src/phone-list/PhoneList.tsx`)** keeps the original markup and CSS classes,
  so the page looks the same and the browser tests did not change.

### Behaviour we changed on purpose

If the phone data fails to load, the original showed an empty list with no explanation. The React
version shows a short message. It is the only visible change, it has its own test, and it is the
kind of change a client should approve explicitly.

### What we gave up

The list items used to animate in and out as you typed (ngAnimate). The React list does not. We
could add it back with a transition library, but adding a dependency to preserve a tutorial
animation is not a good trade. On a client project this goes on the list of differences for
sign-off, not into a silent omission.

**Tests:** 75 unit (40 from the oracle cases, 4 for the list component), 21 browser. All green;
no browser test changed.
