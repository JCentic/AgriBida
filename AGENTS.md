# AgriBida — Agent Instructions

## Project Purpose

AgriBida is a student prototype: a responsive web application that helps Filipino farmers post produce, compare sample buyer bids, inspect sample buyer credibility, and compare offers with sample market-price records.

It is a demonstration only. All users, prices, bids, ratings, reviews, and verification labels are sample data.

## Scope Boundaries

- Build with plain HTML, CSS, and JavaScript unless the user explicitly approves a framework or backend.
- Use browser storage and mock data only. Do not add real accounts, payments, identity verification, external APIs, or live market-price feeds.
- Do not collect sensitive personal, financial, or government-identification information.
- Do not add UI-facing "prototype only" banners or sample-data disclaimer text (decided in `plans/08-auth-redesign-prompt.md`). The audience already knows this is a school project. Internal code comments, plan documents, and mock data itself may still be labeled as sample/mock for maintainability, but the visible interface should read like a normal product.

## Source of Truth

Before changing code, read the plan most relevant to the request in `plans/`:

- `01-agribida-project-plan.md` — product scope and priorities
- `03-functional-and-non-functional-requirements.md` — requirements and validation rules
- `04-user-flow-and-interface-plan.md` — roles, journeys, and required pages
- `05-agribida-data-model.md` — mock-data entities and fields
- `06-agribida-technology-and-development-plan.md` — intended stack and development order
- `07-agribida-test-plan.md` — acceptance tests

When plans conflict, preserve the prototype scope and ask the user to decide before making a material product change.

## Core Roles and Rules

- **Farmer:** manages only their own listings; sees bids; selects a preferred bid.
- **Buyer:** browses open listings; submits or updates only their own bids while a listing is Open.
- **Administrator:** maintains sample buyer trust records and sample market-price records.
- Listing states are `Open`, `Selected`, and `Closed`. Bids are permitted only on Open listings.
- Listing and bid forms must keep valid entered values when showing validation errors.

## Implementation Conventions

- Keep the app simple and maintainable. Prefer small, named JavaScript functions over large monolithic handlers.
- Centralize initial mock data and browser-storage read/write logic so it is easy to reset for a presentation.
- Use semantic HTML, associated labels, keyboard-accessible controls, visible focus states, and readable color contrast.
- Format currency as Philippine pesos (`₱`) and use clear units such as `kg`.
- Keep desktop, tablet, and mobile layouts usable; do not rely only on hover interactions.
- Do not introduce dependencies, build tools, or configuration files unless they solve a stated need and the user approves the scope change.

## Required Validation

- Listing fields: produce name, quantity, unit, location, preferred price, and availability date are required.
- Bid fields: offered price and requested quantity are required and must be positive numbers.
- Enforce role ownership for listing edits and bid updates.
- Show a clear no-data state for unmatched price filters.

## Working Process

1. Inspect the relevant plan and existing implementation before editing.
2. State the intended outcome and make the smallest cohesive change that satisfies it.
3. Update all affected HTML, CSS, JavaScript, and mock data together.
4. Validate the changed flow against the relevant cases in `plans/07-agribida-test-plan.md`.
5. Report what changed, the tests run, and any remaining limitation.

## Do Not Do Without Explicit Approval

- Replace the plain HTML/CSS/JavaScript prototype with a framework or backend.
- Add real authentication, payments, third-party integrations, or live data.
- Delete or substantially rewrite planning documents.
- Add packages or make external changes such as deployments, commits, or publishing.

