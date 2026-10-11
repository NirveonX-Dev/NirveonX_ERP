/**
 * Seed the Master Board with the full Master App (mobile) ticket breakdown.
 *
 *   cd server && node scripts/seedMasterAppTickets.js
 *
 * - Creates all 28 tickets as Tasks (project "Master App", keys MA-1..MA-28).
 * - Wires dependencies (dependsOn) by ticket key.
 * - Pre-assigns ONLY the Phase 0 batch to the three app-dev interns; everything
 *   else is left unassigned in the backlog for the lead to assign later.
 * - Idempotent-ish: skips any MA-* ticket whose key already exists, so re-running
 *   won't create duplicates (but won't update existing ones either).
 *
 * Assignees are matched by name (case-insensitive). If a name isn't found the
 * ticket is still created, just unassigned, and a warning is printed.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../src/db");
const Task = require("../src/models/Task");
const User = require("../src/models/User");

const PROJECT = "Master App";
const DEPT = "appdev";

// Interns (matched by name, case-insensitive, first match wins).
const INTERN = {
  shaswat: "shaswat",
  mayur: "mayur",
  jitesh: "jitesh",
};

// Full ticket set, top to bottom. `key` is informational for dependency wiring;
// the real stored key (MA-N) is derived from order so it always lines up.
// deps: array of keys this ticket is blocked by.
// assignTo: intern lookup string, or null (backlog).
const TICKETS = [
  // ───────────────────────── Phase 0 — Spikes & decisions ─────────────────────────
  {
    key: "MA-1", stream: "ux-architecture", status: "todo", priority: "high", size: "M",
    tags: ["spike", "architecture"], assignTo: INTERN.shaswat, deps: [],
    title: "Spike: navigation model + folder structure proposal",
    description: "Research & propose how the app is navigated and how the code is organised.",
    body: `## WHAT & WHY
We're starting a brand-new React Native app. Before anyone builds screens, we need to agree on (a) how the user moves between screens and (b) how the project's files are organised. This is a RESEARCH ticket — you produce a short proposal, not final code.

## WHERE THIS FITS
One of three Phase-0 spikes done in parallel. Your proposal + MA-2 + MA-3 feed into MA-4, the shared architecture decision the whole team commits to.

## WHAT TO BUILD
- A short written proposal (a markdown file in the repo, e.g. \`/docs/proposals/navigation.md\`, on a branch) covering:
  - Which navigation library (e.g. React Navigation) and why. Note: we're bare RN 0.77, no Expo.
  - The navigation shape: tabs? stack? drawer? How does login → dashboard → a product → a topic flow?
  - A proposed folder structure for the whole app (screens, components, navigation, api, hooks, styles, etc.) with a one-line reason for each folder.
- A tiny throwaway proof: a branch with the nav library installed and 2–3 empty screens you can actually move between on a device. This is to prove it runs, not to be the real app.

## ACCEPTANCE CRITERIA
- [ ] A clear written proposal exists and is understandable by a teammate who hasn't touched the app.
- [ ] It names the navigation library + version and justifies it in 1–2 lines.
- [ ] It shows the screen-to-screen flow for the main journeys (login, dashboard, open product, open topic).
- [ ] It proposes a complete folder structure.
- [ ] The proof branch runs on a device and you can navigate between the sample screens.

## HOW TO TEST
Check out the proof branch, \`npm install\`, run on a device/emulator, confirm you can move between the sample screens.

## OUT OF SCOPE
Real screens, real styling, state management, API calls — those are other tickets. Keep this to navigation + structure only.`,
  },
  {
    key: "MA-2", stream: "ux-architecture", status: "todo", priority: "high", size: "M",
    tags: ["spike", "architecture", "api"], assignTo: INTERN.mayur, deps: [],
    title: "Spike: state management + API/data layer approach",
    description: "Research & propose how we hold app state and how we talk to the backend.",
    body: `## WHAT & WHY
The app talks to the existing NirveonX Master backend (we do NOT build a backend). We need an agreed way to (a) hold app-wide state like the logged-in user and their unlocked products, and (b) make network calls consistently. Research ticket — produce a proposal.

## WHERE THIS FITS
Phase-0 spike done in parallel with MA-1 and MA-3; feeds the shared decision in MA-4.

## WHAT TO BUILD
- A short written proposal (\`/docs/proposals/state-and-api.md\` on a branch) covering:
  - How we store global state (logged-in user, auth token, their entitlements). Do we need a state library at all, or is React Context enough for a start? Justify simply.
  - The shape of a single shared API client: one place that knows the base URL, attaches the auth token to every request, and handles errors + token refresh in one spot.
  - Read the backend repo (NirveonX_Master) to list the endpoints this app will call (auth, products, syllabus, content, cart, profile) with their rough request/response shapes.
- A tiny proof branch: a working \`api\` helper that can hit the backend's health endpoint (or any public GET) and log the result on app start.

## ACCEPTANCE CRITERIA
- [ ] Proposal clearly recommends a state approach and justifies it (no over-engineering — simplest thing that works).
- [ ] Proposal describes ONE shared API client and where token/error handling lives.
- [ ] A list of the backend endpoints the app needs, taken from the real backend code, with request/response shapes.
- [ ] The proof branch actually reaches the backend from a device and logs a response.

## HOW TO TEST
Run the proof branch on a device; confirm it logs a real response from the backend.

## OUT OF SCOPE
Building the real auth flow or real screens. This is the approach + a proof, not the final implementation.`,
  },
  {
    key: "MA-3", stream: "ux-architecture", status: "todo", priority: "high", size: "M",
    tags: ["spike", "design"], assignTo: INTERN.jitesh, deps: [],
    title: "Spike: look & feel — sample Login + Dashboard screens",
    description: "Explore how the app should LOOK. Build sample screens for the lead to pick a direction.",
    body: `## WHAT & WHY
We want this app to look genuinely good and modern — not generic. Before we build real features, we need a visual direction everyone follows, so the three of you don't each invent a different style. This ticket is about exploring the LOOK.

## WHERE THIS FITS
Phase-0 spike done in parallel with MA-1 and MA-2. The direction picked here becomes the reference every later screen matches.

## WHAT TO BUILD
- 2–3 **different** visual takes on two screens: a **Login** screen and a **Dashboard** (a grid of product tiles). Same screens, different looks, so we can compare.
- They can be static/mocked (hardcoded data is fine) — this is about appearance, not wiring.
- Aim for: clean, modern, premium education-app feel. Think about spacing, a nice color choice, good typography, and how it feels on a real phone.

## ACCEPTANCE CRITERIA
- [ ] At least 2 distinct looks for Login + Dashboard, runnable on a device.
- [ ] Screenshots or a screen recording of each option attached to the PR.
- [ ] Each option looks intentional and consistent within itself (not half-finished).
- [ ] It looks good on an actual phone screen, not just a wide simulator.

## HOW TO TEST
Run the branch on a device, view each option, judge how it looks and feels.

## HOW YOU GET THERE IS UP TO YOU
Use whatever tools and methods you like — explore freely, be creative. There is no required design tool and no required process. We judge the final result on screen, not how you made it.

## OUT OF SCOPE
Real login, real data, navigation between everything. Just make the two screens look great as options to choose from.`,
  },
  {
    key: "MA-4", stream: "ux-architecture", status: "backlog", priority: "high", size: "S",
    tags: ["architecture", "decision", "collab"], assignTo: null, deps: ["MA-1", "MA-2", "MA-3"],
    title: "Shared Architecture Decision (team co-authors, lead approves)",
    description: "Combine the three spikes into one agreed architecture the whole team commits to.",
    body: `## WHAT & WHY
The three Phase-0 spikes each propose part of the picture. This ticket merges them into ONE agreed decision so everyone builds the same app the same way. All three of you work on this together — it's the point where you talk and align.

## WHERE THIS FITS
The gate between research and building. Everything in Phase 1 onwards depends on this being decided.

## WHAT TO BUILD
- One document, \`/docs/ARCHITECTURE.md\`, co-authored by all three, that locks in:
  - The navigation library + the app's navigation structure (from MA-1).
  - The folder structure (from MA-1).
  - The state approach + the shared API client design (from MA-2).
  - The chosen visual direction (from MA-3) — which option won, with the agreed base colors, spacing feel, and font.
  - The backend endpoints the app will use, with their shapes (from MA-2).
- Present it to the lead; the lead approves (or asks for changes) before it's merged.

## ACCEPTANCE CRITERIA
- [ ] One ARCHITECTURE.md covering navigation, folders, state, API client, visual direction, and backend endpoints.
- [ ] All three interns contributed (reflected in commits/the PR).
- [ ] The lead has reviewed and approved the final decision.
- [ ] It's concrete enough that MA-5..MA-9 can be built directly from it with no guessing.

## HOW TO TEST
A teammate not involved in writing a given section can read it and know exactly what to build.

## OUT OF SCOPE
Writing the actual app code — that's Phase 1. This ticket is the agreed plan only.`,
  },

  // ───────────────────────── Phase 1 — Foundation ─────────────────────────
  {
    key: "MA-5", stream: "infra", status: "backlog", priority: "high", size: "M",
    tags: ["setup"], assignTo: null, deps: ["MA-4"],
    title: "Project setup: init the RN 0.77 app & run on a device",
    description: "Create the actual React Native project with scripts and env, runnable by everyone.",
    body: `## WHAT & WHY
Turn the empty repo into a real, runnable React Native 0.77 (bare, not Expo) app that every teammate can clone and run. This is the foundation everything else is built on.

## WHERE THIS FITS
First build ticket after the architecture is approved (MA-4). Blocks all feature work.

## WHAT TO BUILD
- Initialise a bare React Native 0.77 app in the repo (match the major setup of the existing Medzzapp mobile app where it makes sense).
- Set up the folder structure agreed in ARCHITECTURE.md.
- Add npm scripts: run Android, start Metro, etc.
- Add a \`.env.example\` with the backend API URL variable (no real secrets).
- Update the README "Getting started" with the real, exact steps.

## ACCEPTANCE CRITERIA
- [ ] A fresh clone + \`npm install\` + the documented run command launches the app on an Android device/emulator showing a starter screen.
- [ ] Folder structure matches ARCHITECTURE.md.
- [ ] \`.env.example\` exists; no real secrets committed; \`.env\` is gitignored.
- [ ] README getting-started steps are accurate (a teammate followed them and it worked).

## HOW TO TEST
On a clean machine/clone, follow the README steps start to finish; the app runs.

## OUT OF SCOPE
Any real screens/features. Just a running skeleton.`,
  },
  {
    key: "MA-6", stream: "infra", status: "backlog", priority: "high", size: "M",
    tags: ["navigation"], assignTo: null, deps: ["MA-5"],
    title: "Navigation shell",
    description: "Wire the agreed navigation with placeholder screens.",
    body: `## WHAT & WHY
Build the navigation skeleton from ARCHITECTURE.md so feature tickets have real screens to drop into. Screens are placeholders for now.

## WHERE THIS FITS
Depends on project setup (MA-5). Most feature tickets depend on this.

## WHAT TO BUILD
- Install + configure the agreed navigation library.
- Create the navigation structure (stacks/tabs/etc.) with placeholder screens for the main areas: Login, Dashboard, Product, Topic, Paywall, Profile.
- Navigating between placeholders works.

## ACCEPTANCE CRITERIA
- [ ] All main placeholder screens exist and are reachable by navigation.
- [ ] Navigation structure matches ARCHITECTURE.md.
- [ ] Back behaviour works sensibly (hardware back on Android too).

## HOW TO TEST
Run on device; move through every placeholder screen and back.

## OUT OF SCOPE
Real screen content, auth gating (that's MA-12), styling beyond placeholder.`,
  },
  {
    key: "MA-7", stream: "infra", status: "backlog", priority: "high", size: "S",
    tags: ["styling"], assignTo: null, deps: ["MA-4"],
    title: "Shared styling foundation (one source of truth)",
    description: "Define the app's colors/spacing/fonts once, in one place, for reuse everywhere.",
    body: `## WHAT & WHY
So every screen feels like the same app, we define the chosen look's colors, spacing scale, font sizes and corner radius ONCE in a single file and import them everywhere. No hardcoding the same color in 20 files.

## WHERE THIS FITS
Depends on the visual direction chosen in MA-4. Used by every UI ticket.

## WHAT TO BUILD
- A single styling source (e.g. \`theme.js\` / a styles constants file — name per ARCHITECTURE.md) exporting the agreed colors, spacing values, font sizes, radii.
- A short note in the file explaining how to use it.
- Convert any existing placeholder screens to pull from it.

## ACCEPTANCE CRITERIA
- [ ] One file is the single source of truth for colors/spacing/fonts.
- [ ] It reflects the direction approved in MA-4.
- [ ] Nothing hardcodes a color/spacing that exists in the theme.
- [ ] Easy for a teammate to import and use (documented in the file).

## HOW TO TEST
Change one color in the theme file; confirm screens using it update.

## OUT OF SCOPE
Building the full component kit (MA-9) or real screens.`,
  },
  {
    key: "MA-8", stream: "infra", status: "backlog", priority: "high", size: "M",
    tags: ["api"], assignTo: null, deps: ["MA-5"],
    title: "Shared API client (base URL, JWT, refresh, errors)",
    description: "The one place all network calls go through.",
    body: `## WHAT & WHY
Every network call in the app must go through ONE shared client so auth, token refresh, and error handling live in a single place — never raw fetch scattered in screens. Built from the API design in MA-2/MA-4.

## WHERE THIS FITS
Depends on project setup (MA-5) and the approved API design (MA-4). Auth + all data tickets depend on this.

## WHAT TO BUILD
- A shared \`api\` module that:
  - Reads the base URL from env.
  - Attaches the auth token (\`Authorization: Bearer ...\`) when present.
  - Handles a 401 by attempting a token refresh (per backend's refresh endpoint), then retrying once.
  - Surfaces errors in a consistent shape callers can handle.
- Token storage using a persistent store (per ARCHITECTURE.md).

## ACCEPTANCE CRITERIA
- [ ] All calls funnel through this one client.
- [ ] Auth header attached automatically when logged in.
- [ ] A 401 triggers one refresh+retry; if refresh fails, the user is cleanly logged out.
- [ ] Errors come back in a consistent shape.

## HOW TO TEST
Point it at the backend, make an authed GET; expire/clear the token and confirm the refresh-or-logout path behaves.

## OUT OF SCOPE
The login UI (MA-10) and specific feature endpoints (their own tickets).`,
  },
  {
    key: "MA-9", stream: "infra", status: "backlog", priority: "medium", size: "M",
    tags: ["ui-kit"], assignTo: null, deps: ["MA-7"],
    title: "Reusable UI kit basics",
    description: "Button, Card, Input, and Loading/Empty/Error states — the shared building blocks.",
    body: `## WHAT & WHY
Small, reusable building blocks so screens are composed, not copy-pasted. Built on the theme (MA-7) so they're consistent everywhere.

## WHERE THIS FITS
Depends on styling foundation (MA-7). Used by most feature screens.

## WHAT TO BUILD
- Core components, each in its own file: Button (variants: primary/secondary), Card, Input/TextField.
- Shared state components: Loading indicator, Empty state, Error state (with retry).
- All pull from the theme; all small (one component per file, within size limits).

## ACCEPTANCE CRITERIA
- [ ] Button, Card, Input, Loading, Empty, Error all exist and use the theme.
- [ ] Each is small and reusable (props in, no global reach).
- [ ] A simple demo/screen shows them rendering correctly on a device.

## HOW TO TEST
Render the components on a scratch screen; check variants and the loading/empty/error states.

## OUT OF SCOPE
Feature-specific components (a syllabus row, a product tile) — those live with their features.`,
  },

  // ───────────────────────── Phase 2 — Auth & entry ─────────────────────────
  {
    key: "MA-10", stream: "auth", status: "backlog", priority: "high", size: "L",
    tags: ["auth", "full-stack"], assignTo: null, deps: ["MA-8", "MA-6"],
    title: "Google sign-in flow",
    description: "Native Google sign-in → backend /auth/google → app session.",
    body: `## WHAT & WHY
Users log in with Google. The app gets a Google token, sends it to the backend's \`/auth/google\`, and receives the app's JWTs + user info. This is the entry point to everything.

## WHERE THIS FITS
Depends on the API client (MA-8) and nav shell (MA-6). Blocks auth state (MA-11) and gating (MA-12).

## WHAT TO BUILD
- Native Google sign-in (library per ARCHITECTURE.md) wired to the real Google client.
- On success, send the Google credential to \`/auth/google\`; store the returned tokens via the API client's token storage; keep the returned user.
- The Login screen uses the look chosen in MA-3/MA-4.
- Handle the failure/cancel path gracefully.

## ACCEPTANCE CRITERIA
- [ ] Tapping "Sign in with Google" runs the native flow and, on success, logs the user in and lands them on the Dashboard.
- [ ] Tokens are stored; the user object is available to the app.
- [ ] Cancelling or a failed sign-in shows a friendly message, no crash.
- [ ] Login screen matches the approved look.

## HOW TO TEST
Sign in with a real Google account on a device; confirm you reach the Dashboard and a subsequent authed API call works.

## OUT OF SCOPE
Auto-login on relaunch + refresh (MA-11), route gating (MA-12).`,
  },
  {
    key: "MA-11", stream: "auth", status: "backlog", priority: "high", size: "M",
    tags: ["auth"], assignTo: null, deps: ["MA-10"],
    title: "Auth state, persistence, auto-login & logout",
    description: "Stay logged in across restarts; refresh; log out cleanly.",
    body: `## WHAT & WHY
A user shouldn't have to log in every time they open the app. Hold auth state app-wide, restore it on launch, refresh when needed, and log out cleanly.

## WHERE THIS FITS
Depends on sign-in (MA-10). Blocks protected routing (MA-12).

## WHAT TO BUILD
- App-wide auth state (per ARCHITECTURE.md) holding user + token status.
- On launch: if a valid/refreshable token exists, restore the session and skip login; else show login.
- A logout action that clears tokens + state and returns to login.

## ACCEPTANCE CRITERIA
- [ ] Logged-in user who kills + reopens the app stays logged in (no re-login).
- [ ] An expired token is refreshed transparently; if refresh fails, user goes to login.
- [ ] Logout clears everything and returns to the login screen.

## HOW TO TEST
Log in, kill the app, reopen → still in. Log out → back to login and no authed call succeeds.

## OUT OF SCOPE
The sign-in UI (MA-10).`,
  },
  {
    key: "MA-12", stream: "auth", status: "backlog", priority: "high", size: "S",
    tags: ["auth", "navigation"], assignTo: null, deps: ["MA-11"],
    title: "Protected routing",
    description: "Gate the app's screens behind being logged in.",
    body: `## WHAT & WHY
Only logged-in users should see the app's main screens. Unauthenticated users get the login screen.

## WHERE THIS FITS
Depends on auth state (MA-11).

## WHAT TO BUILD
- Routing that sends unauthenticated users to Login and authenticated users to the app.
- A sensible loading state while auth is being restored on launch (no fl
  flash of the wrong screen).

## ACCEPTANCE CRITERIA
- [ ] Not logged in → only Login is reachable.
- [ ] Logged in → the app's screens are reachable, Login isn't forced.
- [ ] On launch there's no flicker between login and app before auth resolves.

## HOW TO TEST
Fresh install → login shown. Log in → app. Log out → login. Relaunch while logged in → straight to app, no flicker.

## OUT OF SCOPE
What's inside the protected screens.`,
  },

  // ───────────────────────── Phase 3 — Dashboard & products ─────────────────────────
  {
    key: "MA-13", stream: "dashboard", status: "backlog", priority: "high", size: "L",
    tags: ["full-stack"], assignTo: null, deps: ["MA-12", "MA-9"],
    title: "Product dashboard / switcher",
    description: "The home grid of products, entitlement-aware.",
    body: `## WHAT & WHY
After login, the user sees the products they can open. Locked products are visible but marked locked (to drive upgrades). This is the app's home.

## WHERE THIS FITS
Depends on protected routing (MA-12) and the UI kit (MA-9).

## WHAT TO BUILD
- Fetch products from the backend (\`/products\`) and the user's entitlements.
- A grid/list of product tiles, each showing name/branding and whether it's unlocked for this user.
- Tapping an unlocked product opens its shell (MA-14); tapping a locked one leads toward the paywall (MA-22).
- Uses the approved look; handle loading/empty/error.

## ACCEPTANCE CRITERIA
- [ ] Products load from the backend and render as tiles.
- [ ] Unlocked vs locked is clearly distinguished based on the user's entitlements.
- [ ] Tapping an unlocked product navigates into it.
- [ ] Loading, empty, and error states are handled.
- [ ] Looks consistent with the app's style.

## HOW TO TEST
Log in as a user with some entitlements; confirm unlocked/locked render correctly and navigation works.

## OUT OF SCOPE
The product's internal screens (MA-14+), payments (MA-22+).`,
  },
  {
    key: "MA-14", stream: "product-shell", status: "backlog", priority: "high", size: "M",
    tags: [], assignTo: null, deps: ["MA-13"],
    title: "Product shell",
    description: "The container when a product is opened.",
    body: `## WHAT & WHY
When a user opens a product, they need a consistent container (header, the product's sections/tabs) that the syllabus and study tools live inside.

## WHERE THIS FITS
Depends on the dashboard (MA-13). Hosts syllabus (MA-16) and topic (MA-17).

## WHAT TO BUILD
- A product shell screen that knows which product is open and shows its layout/sections per ARCHITECTURE.md.
- A way back to the dashboard / to switch products.

## ACCEPTANCE CRITERIA
- [ ] Opening a product shows its shell with the product's name/branding.
- [ ] The shell's sections/tabs match the agreed design.
- [ ] Easy to get back to the dashboard.

## HOW TO TEST
Open a product from the dashboard; confirm the shell shows and navigation back works.

## OUT OF SCOPE
Syllabus content (MA-16), topic tools (MA-17+).`,
  },
  {
    key: "MA-15", stream: "product-shell", status: "backlog", priority: "medium", size: "S",
    tags: [], assignTo: null, deps: ["MA-14"],
    title: "Category picker (for products that have categories)",
    description: "Pick a category (e.g. MBBS/BDS) for products that need it.",
    body: `## WHAT & WHY
Some products have categories (e.g. the medical product: MBBS/BDS/Homeopathy/BPT/BITS). Those products need a picker; products without categories skip it.

## WHERE THIS FITS
Depends on the product shell (MA-14).

## WHAT TO BUILD
- For products with categories, a picker screen/section (categories come from the backend).
- Remember the last chosen category where appropriate (per backend behaviour).
- Products without categories never show the picker.

## ACCEPTANCE CRITERIA
- [ ] A product with categories shows the picker; selecting one proceeds into that category's syllabus.
- [ ] A product without categories goes straight in, no picker.
- [ ] Categories come from the backend, not hardcoded.

## HOW TO TEST
Open a category product (picker appears) and a non-category product (no picker).

## OUT OF SCOPE
The syllabus tree itself (MA-16).`,
  },

  // ───────────────────────── Phase 4 — Syllabus & study ─────────────────────────
  {
    key: "MA-16", stream: "syllabus", status: "backlog", priority: "high", size: "L",
    tags: ["full-stack"], assignTo: null, deps: ["MA-14", "MA-8"],
    title: "Syllabus tree screen",
    description: "Render the product's syllabus as an expandable tree.",
    body: `## WHAT & WHY
The core of each product: its syllabus, shown as a navigable tree the user drills into to reach a topic. The tree comes from the backend (\`/syllabus/:product/tree\`), not bundled.

## WHERE THIS FITS
Depends on the product shell (MA-14) and API client (MA-8). Leads into the topic screen (MA-17).

## WHAT TO BUILD
- Fetch the syllabus nodes for the product (+ category if applicable).
- Render them as an expandable tree (parent → children), performant for large trees.
- Tapping a leaf topic opens the Topic screen (MA-17).
- Loading/empty/error states.

## ACCEPTANCE CRITERIA
- [ ] Syllabus loads from the backend and renders as an expandable tree.
- [ ] Large trees scroll/expand smoothly (no janky freeze).
- [ ] Tapping a leaf topic navigates to the topic screen with the right topic.
- [ ] Loading/empty/error handled.

## HOW TO TEST
Open a product with a seeded syllabus; expand nodes; open a topic.

## OUT OF SCOPE
The AI study tools inside a topic (MA-17+).`,
  },
  {
    key: "MA-17", stream: "content-ai", status: "backlog", priority: "high", size: "M",
    tags: [], assignTo: null, deps: ["MA-16"],
    title: "Topic screen scaffold (study-tool tabs)",
    description: "The screen for one topic, with tabs for each AI study tool.",
    body: `## WHAT & WHY
When a user opens a topic, they get the study tools for it (overview, MCQs, essays, viva, cases, etc.) as tabs/sections. This ticket builds the scaffold; the individual tools are MA-18..MA-20.

## WHERE THIS FITS
Depends on the syllabus tree (MA-16). Hosts MA-18, MA-19, MA-20.

## WHAT TO BUILD
- A topic screen showing the topic name/breadcrumb and a tabbed/sectioned layout with a slot for each study tool.
- Tabs switch without losing the topic context.

## ACCEPTANCE CRITERIA
- [ ] Opening a topic shows its name and the set of study-tool tabs.
- [ ] Switching tabs works and keeps the topic context.
- [ ] Layout matches the approved look.

## HOW TO TEST
Open a topic; switch between the (empty for now) tool tabs.

## OUT OF SCOPE
The actual content generation (MA-18+).`,
  },
  {
    key: "MA-18", stream: "content-ai", status: "backlog", priority: "high", size: "M",
    tags: ["full-stack"], assignTo: null, deps: ["MA-17", "MA-8"],
    title: "AI content: Overview tab",
    description: "Fetch + render the topic Overview from the backend (cache-aware).",
    body: `## WHAT & WHY
The first and most-used study tool. The backend generates + caches content; the app requests \`/content/:product/overview\` for the topic and renders it. First real content integration — sets the pattern for the other tools.

## WHERE THIS FITS
Depends on the topic scaffold (MA-17) and API client (MA-8). Pattern reused by MA-19/MA-20.

## WHAT TO BUILD
- Call the backend content endpoint for mode "overview" with the topic details.
- Render the returned content nicely (it comes as structured data/markdown-ish — render readably).
- Loading state (generation can take a few seconds, esp. on a cache miss / backend cold start), error state with retry, and caching awareness (a cached result returns fast).

## ACCEPTANCE CRITERIA
- [ ] Opening the Overview tab fetches and renders the topic's overview.
- [ ] A clear loading state during generation; a friendly error + retry on failure.
- [ ] Content is readable and matches the app's style.
- [ ] A second open of the same topic is fast (served from cache).

## HOW TO TEST
Open a topic's Overview (first time = slower generate; second time = fast). Kill network → see the error + retry.

## OUT OF SCOPE
The other tools (MA-19/20), the free-usage limit UX (MA-21).`,
  },
  {
    key: "MA-19", stream: "content-ai", status: "backlog", priority: "high", size: "M",
    tags: [], assignTo: null, deps: ["MA-18"],
    title: "AI content: MCQ tab",
    description: "Interactive multiple-choice questions for the topic.",
    body: `## WHAT & WHY
MCQs are a key study tool and need interaction (pick an answer, see if right, see the explanation). Reuses the content pattern from MA-18.

## WHERE THIS FITS
Depends on the Overview tab (MA-18) for the established pattern.

## WHAT TO BUILD
- Fetch MCQs for the topic from the content endpoint (mode "mcq").
- Render each question with its options; let the user select; reveal correct/incorrect + the explanation.
- Loading/error/empty + caching, same as MA-18.

## ACCEPTANCE CRITERIA
- [ ] MCQs load for the topic and render as interactive questions.
- [ ] Selecting an option shows whether it's correct and the explanation.
- [ ] Loading/error/empty handled; repeat opens are fast (cache).
- [ ] Matches the app's style.

## HOW TO TEST
Open the MCQ tab; answer questions; confirm correctness + explanations show.

## OUT OF SCOPE
Scoring history/analytics (not in v1), other tools.`,
  },
  {
    key: "MA-20", stream: "content-ai", status: "backlog", priority: "medium", size: "L",
    tags: [], assignTo: null, deps: ["MA-18"],
    title: "AI content: remaining study tools",
    description: "Flashcards/mnemonics, Essay, Viva, Cases tabs.",
    body: `## WHAT & WHY
Round out the study tools using the pattern set by MA-18/MA-19. Each is a tab that fetches its mode from the content endpoint and renders appropriately.

## WHERE THIS FITS
Depends on the Overview tab pattern (MA-18). (May be split into one ticket per tool when picked up — flag that to the lead.)

## WHAT TO BUILD
- Flashcards/Mnemonics tab, Essay tab, Viva tab, Cases tab — each fetching its backend mode and rendering in a way that suits that content type.
- Consistent loading/error/empty + caching across all.

## ACCEPTANCE CRITERIA
- [ ] Each tool fetches and renders its content correctly for a topic.
- [ ] Each handles loading/error/empty and benefits from caching.
- [ ] All consistent with the app's style and the MA-18 pattern.

## HOW TO TEST
Open each tool tab on a topic; confirm correct content + states.

## OUT OF SCOPE
Free-usage limits (MA-21). Consider splitting per-tool when implementing.`,
  },
  {
    key: "MA-21", stream: "content-ai", status: "backlog", priority: "medium", size: "M",
    tags: ["paywall"], assignTo: null, deps: ["MA-18"],
    title: "Free-usage limit UX",
    description: "When a free user hits their quota, prompt an upgrade.",
    body: `## WHAT & WHY
Free users get a limited number of AI generations; the backend enforces it and returns a limit response. The app must handle that gracefully and nudge toward upgrading — not show a raw error.

## WHERE THIS FITS
Depends on at least one content tool existing (MA-18). Ties into the paywall (MA-22).

## WHAT TO BUILD
- Detect the backend's "limit reached" response on a content request.
- Show a clear, friendly message + a path to the paywall/upgrade (MA-22).
- Paid users never see this.

## ACCEPTANCE CRITERIA
- [ ] A free user who exceeds the limit sees a friendly upgrade prompt, not an error.
- [ ] The prompt leads to the paywall.
- [ ] Paid users are unaffected.

## HOW TO TEST
As a free user, exhaust the quota; confirm the upgrade prompt appears and links to the paywall.

## OUT OF SCOPE
The payment itself (MA-22/23).`,
  },

  // ───────────────────────── Phase 5 — Paywall & payments ─────────────────────────
  {
    key: "MA-22", stream: "payments", status: "backlog", priority: "medium", size: "M",
    tags: ["full-stack"], assignTo: null, deps: ["MA-13"],
    title: "Paywall / pricing screen",
    description: "Show plans/tiers for a product from the backend.",
    body: `## WHAT & WHY
To unlock a product, the user needs to see its pricing. Tiers come from the backend; the screen presents them clearly and leads into checkout.

## WHERE THIS FITS
Reached from locked products (MA-13) and the free-limit prompt (MA-21). Leads into checkout (MA-23).

## WHAT TO BUILD
- Fetch pricing tiers for the product from the backend.
- Present plans clearly (price, duration, what's included) in the app's style.
- A clear call-to-action into checkout.

## ACCEPTANCE CRITERIA
- [ ] Pricing tiers load from the backend and render clearly.
- [ ] The CTA proceeds to checkout for the chosen tier.
- [ ] Loading/error handled; matches the app's look.

## HOW TO TEST
Open the paywall for a locked product; confirm tiers show and the CTA proceeds.

## OUT OF SCOPE
The actual payment (MA-23), coupons (MA-24).`,
  },
  {
    key: "MA-23", stream: "payments", status: "backlog", priority: "medium", size: "L",
    tags: ["full-stack", "payments"], assignTo: null, deps: ["MA-22"],
    title: "Razorpay checkout + verify + unlock",
    description: "Take payment via Razorpay, verify with backend, unlock the product.",
    body: `## WHAT & WHY
The actual purchase. Use Razorpay's native checkout, then let the backend verify the payment signature and grant the entitlement, so the product unlocks.

## WHERE THIS FITS
Depends on the paywall (MA-22). Backend already has the order/verify endpoints.

## WHAT TO BUILD
- Create an order via the backend, launch Razorpay's native checkout with the returned order.
- On success, send the payment result to the backend's verify endpoint.
- On verified success, refresh the user's entitlements so the product is now unlocked; show success + route appropriately.
- Handle payment cancel/failure cleanly.

## ACCEPTANCE CRITERIA
- [ ] A user can pay via Razorpay (use test mode/keys) and, on success, the product unlocks (entitlement reflects it).
- [ ] The backend verify step is used — the app never unlocks on the client's say-so alone.
- [ ] Cancel/failure is handled gracefully, no crash, no false unlock.

## HOW TO TEST
With Razorpay test keys, complete a test payment → product unlocks. Cancel a payment → nothing unlocks.

## OUT OF SCOPE
Coupons (MA-24). Use test keys only; do not hardcode live keys.`,
  },
  {
    key: "MA-24", stream: "payments", status: "backlog", priority: "low", size: "S",
    tags: [], assignTo: null, deps: ["MA-22"],
    title: "Coupon redeem flow",
    description: "Redeem a coupon code to unlock/trial a product.",
    body: `## WHAT & WHY
Some users get coupon codes (e.g. a trial). The app needs a way to enter a code and, if valid, unlock/trial the product via the backend.

## WHERE THIS FITS
Depends on the paywall (MA-22). Backend already has the redeem endpoint.

## WHAT TO BUILD
- A coupon entry UI (on the paywall or profile).
- Submit the code to the backend's redeem endpoint; on success, refresh entitlements and show confirmation.
- Clear messaging for invalid/expired/used codes.

## ACCEPTANCE CRITERIA
- [ ] Entering a valid code unlocks/trials the product (entitlement updates).
- [ ] Invalid/expired/already-used codes show a clear message.
- [ ] No crash on bad input.

## HOW TO TEST
Redeem a valid seeded coupon → unlocks. Try an invalid one → friendly error.

## OUT OF SCOPE
Creating coupons (that's backend/admin).`,
  },

  // ───────────────────────── Phase 6 — Profile & polish ─────────────────────────
  {
    key: "MA-25", stream: "profile", status: "backlog", priority: "low", size: "S",
    tags: [], assignTo: null, deps: ["MA-12"],
    title: "Profile screen",
    description: "Show the user's info and their product entitlements.",
    body: `## WHAT & WHY
Users want to see who they're logged in as, what they've unlocked, and be able to log out.

## WHERE THIS FITS
Depends on auth/routing (MA-12).

## WHAT TO BUILD
- A profile screen showing name, email, avatar, and the list of products/entitlements with status.
- A logout button (uses MA-11's logout).

## ACCEPTANCE CRITERIA
- [ ] Profile shows the user's info and their entitlements accurately.
- [ ] Logout works from here.
- [ ] Matches the app's style.

## HOW TO TEST
Open profile; confirm info + entitlements are correct; log out.

## OUT OF SCOPE
Editing profile (not in v1 unless added later).`,
  },
  {
    key: "MA-26", stream: "profile", status: "backlog", priority: "low", size: "M",
    tags: [], assignTo: null, deps: ["MA-25"],
    title: "Study streak / heatmap view",
    description: "Show the user's activity heatmap (paid feature).",
    body: `## WHAT & WHY
A study streak/heatmap motivates users and is a paid feature the backend already supports. Show the activity grid for paid users; nudge free users.

## WHERE THIS FITS
Depends on the profile screen (MA-25). Backend provides the heatmap data.

## WHAT TO BUILD
- Fetch the user's activity from the backend (paid users) and render a year-ish heatmap grid.
- Free users see a locked/upsell state instead.
- Register study activity where appropriate per backend behaviour.

## ACCEPTANCE CRITERIA
- [ ] Paid users see their activity heatmap with correct data.
- [ ] Free users see a locked/upsell state, not an error.
- [ ] Renders cleanly on a phone.

## HOW TO TEST
As a paid user, view the heatmap after some activity. As a free user, confirm the locked state.

## OUT OF SCOPE
Rewards logic (backend handles it).`,
  },
  {
    key: "MA-27", stream: "qa", status: "backlog", priority: "medium", size: "M",
    tags: ["polish"], assignTo: null, deps: ["MA-13"],
    title: "App-wide polish pass",
    description: "Loading skeletons, empty states, transitions, consistency sweep.",
    body: `## WHAT & WHY
Once the core screens exist, a dedicated pass to make the whole app feel finished and premium — consistent spacing, nice loading skeletons, friendly empty states, smooth transitions. This is what makes it feel "really good looking", which is a priority.

## WHERE THIS FITS
Done once enough screens exist (after the dashboard/core flows). A quality sweep, not a feature.

## WHAT TO BUILD
- Replace raw spinners with tasteful loading states/skeletons where it helps.
- Ensure every list/data screen has a proper empty state.
- Smooth navigation transitions; consistent headers, spacing, and components across screens.
- Fix visual inconsistencies against the theme.

## ACCEPTANCE CRITERIA
- [ ] Screens share consistent spacing, headers, and components (feels like one app).
- [ ] Loading and empty states are tasteful, not jarring.
- [ ] Transitions feel smooth on a real device.
- [ ] A walkthrough recording shows a polished, consistent feel.

## HOW TO TEST
Walk the whole app on a device; it should feel finished and consistent throughout.

## OUT OF SCOPE
New features. This is polish only. Refactors beyond polish get their own ticket.`,
  },
  {
    key: "MA-28", stream: "qa", status: "backlog", priority: "medium", size: "M",
    tags: [], assignTo: null, deps: ["MA-8"],
    title: "Error & offline handling + backend cold-start friendliness",
    description: "Graceful behaviour when the network/backend is slow or down.",
    body: `## WHAT & WHY
The backend is on a free tier that sleeps and cold-starts (first request after idle is slow). Plus phones lose connectivity. The app must handle slowness and failure gracefully everywhere, never hang or crash.

## WHERE THIS FITS
Depends on the API client (MA-8); best done once most data screens exist.

## WHAT TO BUILD
- Sensible timeouts + retry/backoff for the cold-start case (a slow first request shouldn't look like a failure).
- A clear offline/connection-lost message where relevant.
- Audit data screens so every one fails soft (never a blank hang or crash) with a retry path.

## ACCEPTANCE CRITERIA
- [ ] A slow (cold-start) backend request shows a loading state and succeeds, not a premature error.
- [ ] With no network, the app shows a clear message and lets the user retry — no crash.
- [ ] No screen hangs forever on a failed request.

## HOW TO TEST
Hit the app when the backend is cold (first call slow). Turn airplane mode on and navigate; confirm friendly messages + retry everywhere.

## OUT OF SCOPE
Full offline caching/sync (not in v1).`,
  },
];

async function run() {
  await connectDB();

  // Resolve interns by name → user doc.
  const users = await User.find({}).select("name").lean();
  const findUser = (needle) => {
    if (!needle) return null;
    const u = users.find((x) => x.name.toLowerCase().includes(needle.toLowerCase()));
    return u ? u._id : null;
  };
  const assigneeFor = (needle) => {
    if (!needle) return null;
    const id = findUser(needle);
    if (!id) console.warn(`⚠️  No user matched "${needle}" — leaving that ticket unassigned.`);
    return id;
  };

  const lead = await User.findOne({ role: "superadmin" }).select("_id").lean();
  const createdBy = lead ? lead._id : null;

  // First pass: create tickets (without deps), remember key → _id.
  const keyToId = {};
  let created = 0, skipped = 0;
  for (let i = 0; i < TICKETS.length; i++) {
    const t = TICKETS[i];
    const ticketKey = `MA-${i + 1}`; // keys are positional so they always line up

    const existing = await Task.findOne({ ticketKey }).select("_id").lean();
    if (existing) { keyToId[t.key] = existing._id; skipped++; continue; }

    const doc = await Task.create({
      ticketKey,
      title: t.title,
      description: t.description || "",
      body: t.body || "",
      project: PROJECT,
      deptKey: DEPT,
      tags: t.tags || [],
      size: t.size || "",
      assigneeId: assigneeFor(t.assignTo),
      status: t.status || "backlog",
      priority: t.priority || "medium",
      createdBy,
    });
    keyToId[t.key] = doc._id;
    created++;
  }

  // Second pass: wire dependencies now that every key has an _id.
  for (let i = 0; i < TICKETS.length; i++) {
    const t = TICKETS[i];
    if (!t.deps || !t.deps.length) continue;
    const id = keyToId[t.key];
    const depIds = t.deps.map((k) => keyToId[k]).filter(Boolean);
    await Task.findByIdAndUpdate(id, { dependsOn: depIds });
  }

  console.log(`\n✅ Master App tickets seeded: ${created} created, ${skipped} already existed.`);
  console.log("   Phase 0 (MA-1..MA-4) assigned; MA-5..MA-28 left in the backlog for the lead to assign.");
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
