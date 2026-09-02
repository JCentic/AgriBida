# AgriBida — Auth Redesign Prompt

This is a working prompt for redesigning the Role Selection / sign-in screen only.
It follows the same Context / Objective / Requirements / Constraints / Expected Output
format as the original project-setup prompt, for consistency in the project's AI-usage
documentation.

## Context

AgriBida is a plain HTML/CSS/JavaScript student prototype (IT 415) for Filipino farmers
to post produce and compare buyer bids, using sample data and browser local storage
only (see `AGENTS.md`, `plans/01` through `plans/07`).

The current entry screen (`index.html`) asks the user to pick a role from three visible
cards (Farmer / Buyer / Administrator), then pick a matching sample account from a
dropdown that is filtered by the chosen role. This exposes the role-selection mechanic
directly in the UI, which does not resemble how a real sign-in works, and the page
carries a highly visible yellow "Prototype only" banner and repeated "sample data"
disclaimer text.

We are not doing a full UI redesign yet — the project is still MVP-first, and the
farmer, buyer, and administrator dashboards have not been built. This pass touches only
the sign-in screen and its supporting script/styles.

## Objective

Redesign the sign-in screen to feel like a modern, Apple-inspired sign-in experience,
and change the interaction model so every account type goes through the **same** sign-in
form. Role is no longer chosen by the user in the UI — it is read from the selected
sample account's existing `role` field (see `plans/05-agribida-data-model.md`, Users
table) and used for role-based (RBAC) routing after sign-in. Remove the "Prototype only"
banner and related sample-data disclaimer copy from the visible interface.

## Requirements

1. **Visual style — Apple-inspired, MVP-scoped**
   - System font stack (e.g. `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`).
   - Centered card-based sign-in container on a soft neutral background, generous
     whitespace, rounded corners (~12–16px), subtle shadow/elevation, a single restrained
     accent color used consistently for primary actions and focus states.
   - Large touch targets (44px minimum height), smooth/subtle transitions on hover,
     focus, and state changes — no jarring or slow animation.
   - Keep it to the sign-in screen; do not carry this visual pass into pages that do
     not exist yet.

2. **Unified sign-in form (no user-facing role picker)**
   - Replace the three role cards with a single account selector (e.g. a searchable
     dropdown or list of sample accounts by name) that is not filtered or grouped by
     role in a way that asks the user to declare a role first.
   - One "Sign In" (or equivalent) action for every account type.

3. **RBAC-aware routing after sign-in**
   - On sign-in, look up the selected account's `role` field and store it via the
     existing `setCurrentUser()` in `js/storage.js`.
   - Since dashboards are not built yet, add a small `routeToDashboard(role)` (or
     similarly named) stub function that is structured so a future dashboard page per
     role can be wired in with a one-line change (e.g. an object/switch mapping role to
     a destination), rather than rewriting the sign-in flow later.
   - Until real dashboards exist, the confirmation message may remain the visible
     result of a successful sign-in, but it should read naturally for any role (not
     just describe "the Farmer" style role-selection wording tied to the old card UI).

4. **Remove prototype/sample-data banner copy**
   - Remove the "Prototype only — ..." banner and the "This is a school prototype..."
     notice paragraph from the visible interface.
   - Note: `AGENTS.md` currently requires "Clearly label prototype data and sample
     verification/reputation information in the interface." This request removes that
     labeling from the sign-in screen going forward. Flag this as a scope decision to
     confirm, and consider updating `AGENTS.md` so it doesn't conflict with future work.

5. **Keep everything else intact**
   - No backend, no real authentication, no password fields — still a simulated
     sign-in against `SAMPLE_USERS` in `js/data.js` via `js/storage.js`.
   - Preserve accessibility: associated labels, keyboard navigability, visible focus
     states, readable contrast.
   - Preserve responsive behavior across mobile, tablet, and desktop.
   - Preserve the existing folder structure and centralized storage functions; do not
     introduce a framework, build tool, or new dependency.

## Constraints

- Plain HTML, CSS, and JavaScript only — no UI frameworks, icon fonts, or external
  libraries unless explicitly approved.
- Do not build the farmer, buyer, or administrator dashboard pages in this pass — only
  prepare the routing stub described above.
- Do not add real authentication, passwords, or identity verification.
- Do not change the underlying data model, ownership rules, or validation rules planned
  for later phases (`plans/03`, `plans/05`).
- Do not delete or substantially rewrite existing planning documents.

## Expected Output

- Updated `index.html`, `css/style.css`, and `js/script.js` implementing the unified,
  Apple-inspired sign-in screen with the prototype/sample-data banner removed.
- A short explanation of the RBAC routing stub and exactly what remains to be wired up
  once the per-role dashboards are built.
- Confirmation of which `plans/07-agribida-test-plan.md` cases (if any) were manually
  re-checked, and note that a docs update to `AGENTS.md`'s prototype-labeling rule is
  pending user confirmation.
