# Cramwise — one-page product brief

**Tagline:** One page. One next step. That’s enough.

## What it is

A calm, browser-local study planner for learners who know what exam is coming but feel stuck with a long list of topics. Add subjects and topics, set an exam date and priorities, then use a daily plan and focus timer to start a manageable session. The learner decides when a topic is complete.

## Who it is for

- **User:** school, college, or exam-prep learner planning alone on one browser/device.
- **Possible future buyer:** tutor or coaching provider who wants to offer a repeatable revision-planning setup. This segment is unvalidated; Cramwise does not currently have coach accounts, cohort views, or reporting.

## Why choose it (hypothesis)

Cramwise emphasizes a small, explainable next step and keeps subjects and notes on the current device without account setup. It is intentionally narrower than full student suites and broad task managers. This value proposition needs user testing; no learning outcome or grade improvement is promised.

## Current workflow

1. Replace sample subjects/topics with the learner's own list.
2. Add an exam date, priority and realistic time estimate.
3. Review the suggested daily plan and start/pause a focus session.
4. Mark progress manually; track completed focus minutes.
5. Download a plan CSV or versioned JSON backup. Restore previews contents before replacing local data.

## Business hypothesis and offer test

Keep the core individual product free during validation. Test a fixed-scope, human-reviewed exam-plan setup with a small number of tutors/coaches or learners. Confirm buyer, deliverables, hours, direct cost, price, support boundary, and willingness to pay before adding accounts or subscription billing. No price, recurring revenue, or sales are established today.

## Success measures for first 90 days

- 5–8 learner and 3–5 tutor/coach conversations completed with consent and no sensitive learner records collected.
- Observed activation: user enters real topics, creates a daily plan, and returns to complete a session.
- Paid pilot commitment, cash collected, delivery hours, direct cost/margin, repeat use, and support requests.
- Decide go/revise/park based on evidence, not signups or repository activity alone.

## Trust and status

- Study state stays in browser storage on the current device; localStorage is not encrypted by the product and can be cleared by the browser.
- Optional research signup is a separate explicit opt-in. It must not include topics, notes or progress.
- Current release has no login, cloud sync, billing, or study API. Live app is at <https://last-minute-study-board.onrender.com/>; local source may be ahead of the live revision.
- Open before commercial launch: learner/tutor demand, intended age range/privacy review, LeadHub host and sender, support/uptime owner, and any account/billing decision.

## Product links

- [Market research](MARKET_RESEARCH.md)
- [Feature roadmap](FEATURE_ROADMAP.md)
- [Architecture](ARCHITECTURE.md)
- [Data-storage decision](decisions/ADR-001-local-first-data.md)
