# Facility Manager

An Angular application for viewing and managing geolocated facilities — a list view, a detail
view with an OpenLayers map, a create/edit form, and an all-facilities map overview. Built as a
front-end technical test (see `project requirements.adoc`).

## Quick start

Requires [Bun](https://bun.sh) (the project is pinned to `bun@1.3.14` via `packageManager` in
`package.json`).

```bash
bun install
bun start
```

Open `http://localhost:4200`. Sign in with the pre-filled demo credentials
(`ama.owusu@amalitech.com` / `demo1234`) — the field values are already populated, just click
**Sign in**.

No backend, database, or external account is required. Facility data ships as a bundled JSON file
(`public/data/facilities.json`, 15 facilities across Ghana and Rwanda) served by an in-memory
repository, and authentication is a mock service backed by `sessionStorage`. This is deliberate:
requirements.adoc asks that the app run "without depending on private services."

## Scripts

```bash
bun start             # dev server at localhost:4200
bun run build          # production build to dist/geo-ops
bun run test            # unit tests (Vitest, via the Angular CLI unit-test builder)
bun run test:coverage   # unit tests with an 80% coverage threshold
bun run lint             # ESLint (TypeScript + Angular + template a11y + security rules)
bun run lint:fix
bun run format           # Prettier (writes)
bun run format:check     # Prettier (check only)
```

## Demoing the loading / error / empty states

- **Loading**: happens naturally on first load (mock latency is ~500ms).
- **Error**: visit `/facilities?simulateError=1` — the list deterministically shows the error +
  retry state without needing a real network failure.
- **Empty**: search for something that doesn't match any facility name (e.g. "zzz"), or filter by
  a status with no matches for your search term. A "Clear filters" action resets the view.

## Architecture

Feature-driven structure — each screen owns its folder; shared/reusable pieces live under
`core/` and `shared/`.

```
src/app/
  core/
    models/        Facility & FacilityDto (+ mapper), AuthUser
    facilities/     FacilityRepository port + LocalFacilityRepository (HttpClient + in-memory store)
    auth/            AuthPort port + MockAuthService, functional route guards
    notifications/   NotificationService (MatSnackBar wrapper)
    validators/      shared Reactive Forms validators (e.g. lat/lng range)
    utils/           Clock (injectable wrapper around `new Date()`, for testability)
  layout/shell/       app chrome: sidebar nav + header, reads page title from route data
  features/
    auth/login/
    facilities/
      facility-list/              search, status filter, pagination, loading/error/empty states
      facility-detail/             info card + map, preserves list filters on "back"
      facility-form/               shared create/edit Reactive Form
      facility-map/                shared OpenLayers wrapper (single or multi-marker)
      facilities-map-overview/     all facilities on one map + a picker list
  shared/status-badge/            Active/Inactive/Maintenance pill, reused across screens
```

All routes are lazy-loaded (`loadComponent`) under `app.routes.ts`.

### Why a repository/port interface for a mock-only app?

`FacilityRepository` and `AuthPort` are plain interfaces with a single `Local*`/`Mock*`
implementation each, injected via `InjectionToken`s in `app.config.ts`. There's no second
(e.g. real-backend) implementation today — the point isn't speculative future-proofing, it's that
the rest of the app (list, detail, form, guards) depends on the *interface*, not on
`HttpClient`/`sessionStorage` directly, which is what actually makes the mock swappable and the
components easy to test in isolation.

### Data model

```ts
interface Facility {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
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
domain model in `facility.mapper.ts` — a deliberately small illustration of separating wire format
from the view/domain model.

### The map

`FacilityMap` (`features/facilities/facility-map`) is the one place that touches OpenLayers. It:

- accepts one or many facilities and an optional `selectedId`;
- fits the view to the bounding box of all markers, or centers/zooms on a single or selected one;
- transforms `[longitude, latitude]` to the map's projection via `fromLonLat`;
- defers map creation to `afterNextRender` (so the DOM target element exists first) and tears the
  map down in `ngOnDestroy` via `map.setTarget(undefined)`, releasing its resources.

It's reused, unmodified, by both the detail view (single marker) and the map overview (many
markers, click-to-select).

### Filter persistence

The list syncs `search` / `status` / `page` to the URL's query params (`replaceUrl: true`, so
filtering doesn't spam browser history). The detail view's "Back to facilities" button calls
`Location.back()` rather than a hardcoded `routerLink`, so it lands back on whatever
filtered/paginated state was last on screen.

### Deviations from the general house style

- **Reactive Forms**, not Signal Forms — requirements.adoc explicitly mandates Reactive Forms.
- **No Firebase / no real backend** — the app must run without external dependencies; see
  "Quick start" above.

## Testing

Unit tests cover the parts with actual logic worth verifying in isolation, rather than chasing a
coverage number end to end:

- `facility.mapper.spec.ts` — DTO ↔ domain mapping, and the unknown-status guard.
- `local-facility-repository.spec.ts` — `getAll`/`getById`/`create`/`update` against
  `HttpTestingController`, including the "update a non-existent id throws" path.
- `mock-auth.service.spec.ts` — login success/failure and logout, including session persistence.
- `range-validator.spec.ts` — the shared lat/lng range validator, boundary values included.

Not covered: component-level tests (list/detail/form rendering, route guards in situ) and E2E.
With more time, I'd add:
- component tests for `FacilityList` (query-param sync, pagination, all three non-loaded states)
  and `FacilityForm` (validation messages, duplicate-submit guard);
- a Playwright E2E smoke test for the full create → view → edit flow;
- an integration test for `authGuard`/`guestGuard` redirects.

## Accessibility

Angular Material components (form fields, select, table, paginator, snack bar, spinner) carry
most of their own ARIA/keyboard-interaction semantics. On top of that: decorative icons are
`aria-hidden`, icon-only buttons have `aria-label`s, the login/error banners use `role="alert"`,
and submit buttons that collapse to a spinner-only state while saving get a dynamic `aria-label`
(their visible text disappears at that point). The one thing I'd still want to verify with a real
screen reader and an automated pass (axe-core) is focus management on route changes — right now
focus isn't explicitly moved to the new view's heading after navigation.

## Docker

```bash
docker build -t geo-ops .
docker run --rm -p 8080:80 geo-ops
```

Multi-stage build: `bun run build` on `node:24-alpine` (bun installed on top — bun's own Docker
image reports a Node compatibility version below the Angular CLI's minimum, so a real Node
binary is used instead), then the static output is served by `nginx:alpine` with an SPA fallback
(`nginx.conf`) so deep links like `/facilities/FC-0001` work on refresh.

## CI

`.github/workflows/ci.yml` runs format-check, lint, test, and build on every push/PR to `main`.

## What I'd do next with more time

- Component/E2E test coverage as listed above.
- Real focus management on route change (move focus to the page's `<h1>`/`<h2>`), plus a pass with
  an automated accessibility checker.
- A responsive collapse for the sidebar below ~768px — the main content areas are responsive, but
  the shell's fixed-width sidebar isn't optimized for small screens yet.
- Debounced, cancellable in-flight requests if the mock latency were replaced with a real API
  (today a single `getAll()` call is cached in-memory, so this isn't yet a real concern).

## AI-assisted development

Built with Claude Code (Anthropic). It was used to scaffold the FDD folder structure, generate the
bulk of the component/service code from a discussed plan, and iterate on lint/type errors. All
generated code was reviewed, and the architectural decisions (repository/port pattern, no external
backend, route structure, map component boundaries) were discussed and confirmed before
implementation — see the plan this was built from for the reasoning behind each decision.
