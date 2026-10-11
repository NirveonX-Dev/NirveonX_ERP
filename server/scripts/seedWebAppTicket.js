/**
 * Seed a single Master Web App ticket (Next.js migration + multi-page SEO) and
 * assign it to Sibani Bisoyi.
 *
 *   cd server && node scripts/seedWebAppTicket.js
 *
 * Idempotent: skips if a ticket with the same title already exists.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("../src/db");
const Task = require("../src/models/Task");
const User = require("../src/models/User");

const PROJECT = "Master Web App";
const DEPT = "webdev";
const ASSIGNEE_NAME = "sibani";

const TITLE = "Migrate the web app to Next.js: multi-page + SEO-friendly";

const BODY = `## WHAT & WHY
The current Master web app is a client-side React (Vite) single-page app. Because everything renders on the client, search engines get a near-empty HTML shell — there are effectively no real, indexable pages, no per-page titles/descriptions, no sitemap. That's bad for SEO and makes the site feel like one disfunctional page.

We're moving it to **Next.js** so each page is server-rendered / statically generated with real HTML, proper per-page meta tags, and a sitemap — the gold standard for SEO. This ticket turns the existing content into proper, separate, SEO-friendly pages.

## WHERE THIS FITS
This is the foundation for the Master Web App's public presence. Programmatic per-product / per-topic landing pages (mass auto-generated SEO pages) come LATER as a separate ticket — this one is the multi-page + SEO foundation on Next.js.

## WHAT TO BUILD
- Set up a **Next.js** project for the web app (App Router or Pages Router — your choice, justify it briefly in the PR).
- Recreate the existing site's pages as **proper separate routes**, each a real page: at minimum **Home, Products, Pricing, Login** (map the current single-page sections into these). Keep the existing look/branding.
- Each public page is **server-rendered or statically generated** (not client-only) so crawlers see real content.
- **Per-page SEO metadata:** a unique \`<title>\` and meta description for every page, plus Open Graph tags (title, description, image) for link previews.
- Generate a **\`sitemap.xml\`** listing the public pages, and a **\`robots.txt\`**.
- Keep the app talking to the existing NirveonX Master backend for any data it already uses (don't rebuild the backend).
- Deploys on Vercel (Next.js is first-class there).

## ACCEPTANCE CRITERIA
- [ ] The web app runs on Next.js and builds cleanly (\`next build\` passes).
- [ ] Home, Products, Pricing, and Login exist as separate routed pages (not sections of one page), each reachable by its own URL.
- [ ] Viewing page source (or "view rendered HTML") of a public page shows real content + the page's title/description — NOT an empty JS shell.
- [ ] Every public page has a unique \`<title>\`, meta description, and Open Graph tags.
- [ ] \`sitemap.xml\` and \`robots.txt\` are served and list/allow the public pages.
- [ ] Existing look/branding is preserved; nothing that worked before is broken.

## HOW TO TEST
- Run \`next build\` — it passes.
- Open each page at its own URL; confirm it renders and has the right title (browser tab).
- "View page source" on Home — you can see the heading text and meta tags in the raw HTML.
- Visit \`/sitemap.xml\` and \`/robots.txt\` — both load and look right.
- Run Lighthouse (SEO category) on a couple of pages — SEO score should be strong (aim 90+).

## OUT OF SCOPE
- Programmatic per-product / per-topic auto-generated landing pages (future ticket).
- Any backend changes — reuse the existing backend as-is.
- A visual redesign — keep the current look; this is about structure + SEO, not restyling.`;

async function run() {
  await connectDB();

  const existing = await Task.findOne({ project: PROJECT, title: TITLE }).lean();
  if (existing) {
    console.log(`Ticket already exists (${existing.ticketKey}); nothing to do.`);
    await mongoose.connection.close();
    process.exit(0);
  }

  // Assignee
  const sibani = await User.findOne({ name: new RegExp(ASSIGNEE_NAME, "i") }).select("name").lean();
  if (!sibani) console.warn(`⚠️  No user matched "${ASSIGNEE_NAME}" — creating the ticket unassigned.`);
  const assignees = sibani ? [sibani._id] : [];

  const lead = await User.findOne({ role: "superadmin" }).select("_id").lean();

  // Next MWA-N key (per-project).
  const prefix = Task.PROJECT_PREFIX[PROJECT] || "V";
  const re = new RegExp(`^${prefix}-\\d+$`);
  const rows = await Task.find({ ticketKey: re }).select("ticketKey").lean();
  const max = rows.reduce((m, t) => {
    const n = parseInt((t.ticketKey || "").split("-")[1], 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  const ticketKey = `${prefix}-${max + 1}`;

  const task = await Task.create({
    ticketKey,
    title: TITLE,
    description: "Move the Vite SPA to Next.js; real multi-page routes with per-page SEO + sitemap.",
    body: BODY,
    project: PROJECT,
    deptKey: DEPT,
    tags: ["web", "seo", "nextjs", "migration"],
    size: "L",
    priority: "high",
    status: assignees.length ? "todo" : "backlog",
    assignees,
    assigneeId: assignees[0] || null,
    createdBy: lead ? lead._id : null,
  });

  console.log(`✅ Created ${task.ticketKey} "${TITLE}" ${sibani ? "→ " + sibani.name : "(unassigned)"}`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
