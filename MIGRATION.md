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

## Step 3: the phone detail page becomes React

**Tag:** `step-3`. **What changed:** the detail screen and the `checkmark` filter.

Same pattern as step 2: `<phone-detail>` is now a React component registered through the bridge.
The one new problem is input. The AngularJS component injected `$routeParams` to find out which
phone to show; a React component should not know about AngularJS services. So the route now
resolves the id and passes it in as a binding:

```js
template: '<phone-detail phone-id="$resolve.phoneId"></phone-detail>',
resolve: { phoneId: ['$route', function($route) { return $route.current.params.phoneId; }] }
```

That keeps the React component a plain function of its props (`<PhoneDetail phoneId="nexus-s" />`),
which is exactly what React Router will give it in step 4. This is the only edit we made to the
original AngularJS code during the whole migration.

- `checkmark` became a one-line TypeScript function with the same output.
- The component handles three states the original ignored: loading (renders nothing, as before),
  not found, and failed. The original showed an empty page skeleton for an unknown phone; the React
  version says the phone was not found. Again: deliberate, tested, and listed for sign-off.
- We kept a known HTML error from the original template (a `<dd>` outside any `<dl>` under
  "Additional Features") so this step changes nothing a user could see. We fix it in step 5. Mixing
  "port" and "improve" in one step makes failures harder to explain.

### What we gave up

The main image used to slide in and out using a jQuery animation registered with ngAnimate. React
does not go through ngAnimate, so the image now swaps instantly. At this point jQuery is only loaded
for an animation that no longer runs; it goes in step 5.

The `Phone` service and the AngularJS `checkmark` filter are now unused by the app, but we leave
them until step 5: steps 2 to 4 only add or replace; step 5 deletes. That keeps each diff easy to
review.

**Tests:** 80 unit (4 for the detail component, 1 for `checkmark`), 21 browser. All green; no
browser test changed.

## Step 4: React Router takes over the URLs

**Tag:** `step-4`. **What changed:** routing, the HTML entry point, where the data is served from,
and the URL format.

With both screens in React, AngularJS was doing one job: reading the URL and choosing a screen.
We replaced that with React Router (`src/routes.tsx`) and stopped bootstrapping AngularJS. The
AngularJS code is now dead but still in the repository; step 5 deletes it.

- **Same routes, clean URLs.** `/phones` and `/phones/:phoneId`, and anything else redirects to the
  list, exactly like `otherwise('/phones')`. The `#!` is gone.
- **Old links keep working.** Before the router starts, `src/legacyUrls.ts` rewrites any AngularJS
  hash URL (`/index.html#!/phones/nexus-s`, and the pre-1.6 `#/phones/nexus-s` style) to the new
  path with `history.replaceState`, so there is no redirect flash and no extra history entry. Users'
  bookmarks, links in old emails and search engine results all still land on the right page.
- **The characterisation tests changed in exactly one place:** the `urls` object at the top of the
  file. We added four tests for the old URLs.

### What broke, and why it is the interesting part

The first run of the browser tests after switching the router failed 9 of 25 tests: every
detail page showed "could not find that phone". The data layer asked for `phones/nexus-s.json`, a
*relative* URL. With hash URLs the page was always `/index.html`, so that resolved to
`/phones/nexus-s.json`. With clean URLs the page is `/phones/nexus-s`, so the same request went to
`/phones/phones/nexus-s.json`. Images on the detail page had the same problem. None of our unit tests
caught this, because each unit is correct on its own; the browser tests caught it immediately,
which is why we keep them.

We fixed it in two ways:

- Data and image URLs are now root-relative (`/data/phones/...`, `/img/phones/...`), built from
  Vite's `BASE_URL` so the app can still be deployed under a sub-path. Image paths are resolved when
  rendering, not when loading, so the search still sees exactly the original data.
- The JSON moved from `/phones/` to `/data/phones/`. With clean URLs, a folder called `phones` next
  to a page called `/phones` is a trap: a common static-server setup will see the folder and
  redirect `/phones` to `/phones/` or return a directory error instead of the app. In a real project
  this is the moment to talk to whoever runs the web server.

### Trade-off: clean URLs need server support

Hash URLs work on any static host because the server only ever sees `/index.html`. Clean URLs
need the server to answer `/phones/nexus-s` with `index.html` (an "SPA fallback"). Vite's preview
server does this, and most hosts support it with one line of configuration, but it must be done
before go-live or deep links will return 404. If that is not possible, React Router's
`createHashRouter` keeps hash URLs and the rest of this step still applies.

**Tests:** 91 unit (redirect mapping and data layer tests added), 25 browser (4 added for old
URLs). All green.
