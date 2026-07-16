# Facility Manager

An Angular application for viewing and managing geolocated facilities - a searchable/filterable
list, a detail view with an OpenLayers map, a create/edit form with a click-to-place map picker,
and an all-facilities map overview. Built as a front-end technical test (see
`project requirements.adoc`).

## Quick start

Requires [Bun](https://bun.sh) (the project is pinned to `bun@1.3.14` via `packageManager` in
`package.json`).

```bash
bun install
bun start
```

Open `http://localhost:4200`. Sign in with the pre-filled demo credentials - the fields are
already populated, just click **Sign in**.

No backend, database, or external account is required. Facility data ships as a bundled JSON file
(`public/data/facilities.json`, 15 facilities across different locations), served through an
in-memory + `localStorage`-backed repository, and authentication is a mock service backed by
`sessionStorage`. This is deliberate: requirements.adoc asks that the app run "without depending
on private services."

## Scripts

```bash
bun start               # dev server at localhost:4200
bun run build            # production build to dist/geo-ops
bun run test              # unit tests (Vitest, via the Angular CLI unit-test builder)
bun run test:coverage     # unit tests with a 90% coverage threshold (see vitest.config.ts)
bun run lint               # ESLint (TypeScript + Angular + template a11y + security rules)
bun run lint:fix
bun run format             # Prettier (writes)
bun run format:check       # Prettier (check only)
```

## Demoing the loading / error / empty states

- **Loading**: happens naturally on first load (mock latency is ~500ms) and shows a skeleton
  table/row placeholder.
- **Error**: visit `/facilities?simulateError=1` - the list deterministically shows the error +
  retry state without needing a real network failure.
- **Empty**: search for something that doesn't match any facility name (e.g. "zzz"), or filter by
  a status with no matches for your search term. A "Clear filters" action resets the view.

## Architecture

Feature-driven, type-grouped structure: `core/` and `shared/` are organized by _what kind of thing_
each file is (a service, a guard, a constant, a pipe...), and `features/`/`layout/` are organized
by _what screen_ they belong to.

```
src/app/
  core/
    constants/      static reference data: facility status/type options + colors, demo
                     credentials - anything that's app-wide "static data", not view-specific
    dtos/            FacilityDto - the raw wire shape (lat/lng/updated), separate from the
                     domain model
    guards/          authGuard / guestGuard (functional route guards)
    interfaces/      Facility, FacilityStatus, FacilityDraft, AuthUser - types only
    mappers/         facility.mapper.ts - FacilityDto -> Facility (+ the reverse for writes)
    services/        LocalFacilityRepository, MockAuthService, NotificationService,
                     LocalStorageService, Clock, the MatIconRegistry registration provider
    tokens/          AUTH_PORT / FACILITY_REPOSITORY - InjectionTokens for the port interfaces
    validators/       shared Reactive Forms validators (lat/lng range)
  layout/
    main-layout/      app chrome: collapsible sidebar nav (drawer below the lg breakpoint) +
                     header, reads the page title/subtitle from route data
  features/
    auth/login/
    facilities/
      facility-list/               search, status filter, pagination (with a page-size
                                   dropdown), loading/error/empty states
      facility-detail/              info card + map, preserves list filters on "back"
      facility-form/                shared create/edit Reactive Form
      facility-map/                 read-only OpenLayers wrapper (single or multi-marker,
                                   status-colored pins)
      facility-location-picker/     editable OpenLayers wrapper for the form - click, drag,
                                   or type coordinates, all kept in sync
      facilities-map-overview/      all facilities on one map + a picker list
  shared/
    components/status-badge/      Active/Inactive/Maintenance pill, reused across screens
    constants/                    data shared across 2+ features (the generic load-error
                                   copy, the marker icon src/anchor)
    pipes/                        SentenceCasePipe (statuses are stored lowercase; this pipe
                                   is the only thing that capitalizes them for display)

public/
  data/facilities.json            the bundled mock dataset
  icons/                          every icon in the app as a standalone SVG (see "Icons" below)
```

All routes are lazy-loaded (`loadComponent`) under `app.routes.ts`.

### Why a repository/port interface for a mock-only app?

`FacilityRepository` and `AuthPort` are plain interfaces with a single `Local*`/`Mock*`
implementation each, injected via `InjectionToken`s in `app.config.ts`. There's no second
(e.g. real-backend) implementation today - the point isn't speculative future-proofing, it's that
the rest of the app (list, detail, form, guards) depends on the _interface_, not on
`HttpClient`/`sessionStorage` directly, which is what actually makes the mock swappable and the
components easy to test in isolation.

### Data model

```ts
interface Facility {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "maintenance";
  updatedAt: string;
  latitude: number;
  longitude: number;
  region?: string;
  manager?: string;
  capacity?: string;
  description?: string;
}
```

The bundled JSON is a `FacilityDto` (raw shape: `lat`/`lng`/`updated`) mapped to the `Facility`
domain model in `facility.mapper.ts` - a deliberately small illustration of separating wire format
from the view/domain model. Status is stored lowercase as plain data; `SentenceCasePipe` is the
only place that turns it into `Active`/`Inactive`/`Maintenance` for display, so the data layer
never has to think about presentation casing.

### Persistence

`LocalFacilityRepository` seeds `localStorage` from the bundled JSON on the very first load, and
every `create`/`update` writes the full facility list back to it. Reloading the page, or coming
back later, keeps whatever you've added or changed - it isn't reset to the bundled dataset every
session. Auth session persistence works the same way, via `sessionStorage`, in `MockAuthService`.

### The map(s)

Two small, single-purpose OpenLayers wrapper components, both under `features/facilities/`:

- **`FacilityMap`** (read-only) - accepts one or many facilities and an optional `selectedId`;
  fits the view to the bounding box of all markers, or centers/zooms on a single or selected one;
  renders each facility as a teardrop pin (`public/icons/marker.svg`) tinted per status via
  OpenLayers' `Icon` `color` option, so one asset covers all three statuses instead of three
  separate files.
- **`FacilityLocationPicker`** (editable) - used only in the create/edit form. Clicking the map or
  dragging the marker (via `ol/interaction/Translate`) updates the form's latitude/longitude
  fields; typing directly into those fields moves the marker and re-centers the map. Both
  directions are kept in sync without a feedback loop (guarded by a last-emitted-coordinate check).

Both:

- transform `[longitude, latitude]` to the map's projection via `fromLonLat` (and back via
  `toLonLat` for user-driven changes);
- defer map creation to `afterNextRender` (so the DOM target element exists first) and tear the
  map down in `ngOnDestroy` via `map.setTarget(undefined)`, releasing its resources.

### Icons

Every icon in the app (nav, buttons, empty/error states, the map markers) is a standalone SVG
under `public/icons/`, registered once via `MatIconRegistry.addSvgIcon()` and rendered as
`<mat-icon svgIcon="...">`. Because Material fetches and inlines the SVG into the DOM (rather than
loading it as an opaque `<img>`), icons still pick up `currentColor` and respond to hover/active
state color changes exactly as the old inline `<svg>` markup did - externalizing them didn't cost
any theming flexibility. The registration logic itself (`registerIcons()`) is a plain, directly
unit-tested function; only the thin `provideAppInitializer` wrapper around it depends on Angular's
DI/bootstrap lifecycle.

### Filter persistence

The list syncs `search` / `status` / `page` / `pageSize` to the URL's query params
(`replaceUrl: true`, so filtering doesn't spam browser history). The detail view's
"Back to facilities" button calls `Location.back()` rather than a hardcoded `routerLink`, so it
lands back on whatever filtered/paginated state was last on screen.

### Responsive design

The sidebar collapses into a slide-in drawer (toggled by a hamburger button) below the `lg`
breakpoint, with a backdrop and close button. The facilities table scrolls horizontally on narrow
viewports instead of squeezing its columns unreadably. The facility form's Cancel/Save buttons
stack full-width on mobile. The map-overview's list/map split explicitly sizes both panes on
mobile (a grid without defined row heights would otherwise collapse both to zero height there).

### Deviations from the general house style

- **Reactive Forms**, not Signal Forms - requirements.adoc explicitly mandates Reactive Forms.
- **No Firebase / no real backend** - the app must run without external dependencies; see
  "Quick start" above.

## Testing

```bash
bun run test:coverage
```

103 tests across 19 spec files, enforcing a 90% minimum on statements/branches/functions/lines
(configured in `vitest.config.ts`, wired up via `angular.json`'s `runnerConfig` option - see the
comment in that file for why `angular.json` still keeps its own copy of the include/exclude globs
alongside it). Covers:

- every guard, service, pipe, and constants-adjacent provider (`authGuard`/`guestGuard`,
  `LocalFacilityRepository` including the localStorage cache/dedup paths, `MockAuthService`,
  `NotificationService`, `LocalStorageService`, `Clock`, `SentenceCasePipe`, the icon registry);
- every routed component (`Login`, `MainLayout`, `FacilityList`, `FacilityDetail`, `FacilityForm`,
  `FacilitiesMapOverview`) - loading/error/empty states, form validation and the
  duplicate-submission guard, query-param restoration, pagination, filtering, and navigation;
- `FacilityMap`'s input-driven computed state (its `ariaLabel`, lifecycle safety).

**Not covered**: the OpenLayers-internal logic inside `FacilityMap`/`FacilityLocationPicker`
(marker rendering, click/drag handling, view fitting). Both components defer map creation to
`afterNextRender`, which - by design - never fires during a synchronous `TestBed.detectChanges()`
call (verified empirically; forcing it via `autoDetectChanges()` + `whenStable()` doesn't help
either), so the real `ol/Map` never actually initializes under test. That logic is exercised
manually/visually instead; seeing it work end-to-end would need a real browser (Playwright), not
another unit-testing trick.

## Accessibility

Angular Material components (form fields, select, table, paginator, snack bar, spinner) carry
most of their own ARIA/keyboard-interaction semantics. On top of that: decorative icons are
`aria-hidden`, icon-only buttons have `aria-label`s, the login/error banners use `role="alert"`,
and submit buttons that collapse to a spinner-only state while saving get a dynamic `aria-label`
(their visible text disappears at that point). The one thing I'd still want to verify with a real
screen reader and an automated pass (axe-core) is focus management on route changes - right now
focus isn't explicitly moved to the new view's heading after navigation.

## Docker

```bash
docker build -t geo-ops .
docker run --rm -p 8080:80 geo-ops
```

Multi-stage build: `bun run build` on `node:24-alpine` (bun installed on top - bun's own Docker
image reports a Node compatibility version below the Angular CLI's minimum, so a real Node binary
is used instead), then the static output is served by `nginx:alpine` with an SPA fallback
(`nginx.conf`) so deep links like `/facilities/FC-0001` work on refresh.

## CI/CD

`.github/workflows/ci.yml` runs format-check, lint, `test:coverage`, and build on every push/PR to
`main`. On a successful push to `main` specifically, a second job deploys the build to Vercel
(`vercel pull` → `vercel build` → `vercel deploy --prebuilt --prod`), using Vercel's own Angular
framework preset to generate the SPA fallback routing rather than a hand-rolled `vercel.json`.

## Requirements checklist

Everything in requirements.adoc's mandatory list is implemented: Angular + TypeScript + Angular
Material, Angular routing, Reactive Forms, a repository/port service layer, OpenLayers, ESLint,
Prettier, typed models, list/detail/edit navigation, error handling, loading-state management, and
this README.

Of the optional list, implemented: lazy loading, signals, a mock auth guard, filter persistence
via query params, responsive design, accessibility basics, unit tests, a Dockerfile, a CI pipeline
(GitHub Actions rather than GitLab CI, since the repository is hosted on GitHub), skeleton loading
states, success/error notifications, and DTO/view-model separation.

**Not implemented**: an HTTP interceptor for centralized request/error handling. There's a
`NotificationService` for user-facing success/error messages and each repository method surfaces
its own errors, but there's no interceptor sitting in front of `HttpClient` - see below.

## What I'd do next with more time

- **An HTTP interceptor** for centralized error handling (e.g. normalizing error shapes, retry-once
  on transient failures) instead of each call site handling its own `error:` callback. Currently
  low-value here specifically because there's only one real HTTP call in the whole app
  (`LocalFacilityRepository`'s initial JSON fetch - `create`/`update` never touch `HttpClient`),
  but it's the clearest structural gap against the optional requirements list.
- **A Playwright E2E smoke test** for the full create → view → edit flow, and specifically for the
  two OpenLayers components' actual map behavior (click-to-place, drag, marker rendering), which
  unit tests structurally cannot exercise - see the Testing section above.
- **Real focus management on route change** (move focus to the page's `<h1>`/`<h2>`), plus a pass
  with an automated accessibility checker (axe-core).
- **Debounced/cancelled in-flight requests** if the mock latency were replaced with a real API
  (today a single `getAll()` call is cached in memory and `localStorage`, so this isn't yet a real
  concern).
- **Conflict handling for `localStorage` persistence** across multiple tabs (no `storage` event
  listener today - a change in one tab won't reflect in another until it reloads).

## AI-assisted development

Enhanced development workflow with Claude Code across an iterative, plan-then-implement workflow: each feature
or refactor was scoped into its own branch, implemented, verified (lint/build/test/coverage), and
merged via its own pull request before the next began. The architecture, folder structure, and
overall design were driven by me throughout - including function implementation and code
organisation - with Claude Code offloading the repetitive and redundant parts of that work: scaffolding the
FDD folder structure, generating the bulk of component/service code and tests from plans I laid
out, extracting/refactoring existing code (constants, icons, the localStorage persistence layer),
and iterating on lint/type/coverage feedback. All generated code was reviewed; architectural
decisions (the repository/port pattern, no external backend, the two-OpenLayers-components split,
the coverage-config split between `angular.json` and `vitest.config.ts`) were made by me and
confirmed before implementation, and verified empirically where the outcome wasn't obvious upfront
(e.g. the Vitest external-config coverage-attribution issue documented in `vitest.config.ts`).
