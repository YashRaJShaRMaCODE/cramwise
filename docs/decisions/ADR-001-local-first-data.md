# ADR-001: Keep the study planner local-first

- **Status:** Accepted for the current individual product; revisit only after user interviews or a signed pilot identify a concrete sync requirement.
- **Date:** 2026-11-17
- **Decision owners:** Product owner

## Context

Cramwise currently helps one learner turn exam topics into sessions. The implemented UI stores the study plan and notes in browser localStorage, provides a manual JSON backup, and does not require a login. The repository has Django scaffolding, but the study page does not use it. The A-to-Z playbook identifies demand, age/privacy review, LeadHub configuration, and paid-offer validation as open gates. Building central accounts, a database, or billing now would add cost and sensitive-data handling before proving the need.

## Decision

Keep core study planning on-device and available without account creation. Keep email research opt-in separate and send no study data. Offer user-controlled export/restore. Treat the current Django code as unused scaffold until a buyer-backed requirement is approved.

## Consequences

**Benefits**
- No study notes are sent to the product server; users can start without account setup.
- The app can operate without an auth/database vendor and can be statically hosted.
- A future paid pilot can be tested as a human-delivered planning setup before recurring SaaS costs are committed.

**Costs and risks**
- Data is tied to browser/device/origin and may be cleared by the user or browser; manual backup is needed for migration.
- There is no cross-device sync, account recovery, collaborative/tutor view, or server analytics.
- Shared-device privacy and younger-user expectations need a review; localStorage is not encrypted at rest by this product.
- A local opt-in form cannot be called live until LeadHub host/sender configuration and deployment are verified.

## Alternatives considered

1. **Use Django/PostgreSQL plus accounts immediately:** rejected; no validated multi-device/tutor requirement or paid offer, and this would create new privacy, security, backup, and support responsibilities.
2. **Add Stripe/Razorpay immediately:** rejected; no validated offer, price, refund/cancellation terms, or payment/tax owner. A test-mode integration would not prove demand.
3. **Keep a manual, browser-local product and validate a bounded tutor/coach pilot:** selected. Revisit service architecture only when a buyer requires shared access and pays for a defined pilot.

## Revisit when

A buyer commits to a pilot that requires persistent multi-device or tutor access, and the owner approves audience/age, data fields, retention, deletion, support, and operating cost. Create a new ADR before changing the trust boundary.
