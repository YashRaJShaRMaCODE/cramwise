# Cramwise

**One page. One next step. That’s enough.** A calm, local-first revision workspace that turns a large exam list into small sessions you can finish.

**Live app:** <https://last-minute-study-board.onrender.com/>

## Product direction

The current release is a free, individual study planner that keeps plans and notes in the learner's browser. A paid path worth validating is a branded revision-planning setup for a tutoring or coaching provider. This build has no class workspaces, educator reporting, accounts, or billing, so it is not ready to be sold as a school subscription. Keep it as a public product demo until those needs and buyer demand are validated.

## Study tools

- Set an exam date and see a live day countdown.
- Add up to 12 subjects, search by subject or topic, and build each list from small revision sessions.
- Set each new topic's estimate from 5 to 120 minutes; its focus timer uses that same estimate.
- Import a CSV syllabus after previewing valid rows, duplicates, and errors; only confirmed topics are added, on this device.
- Mark topics high, normal, or low priority; older backups keep working and default to normal priority.
- Check off topics and see progress update immediately.
- See the estimated minutes left for each subject and across the whole plan.
- Set a realistic daily study target from unfinished minutes and your exam date; it recalculates as you finish topics and rolls over at local midnight.
- Get a priority-first daily plan that fits the target when possible, then start any suggested focus session yourself. Suggestions never check topics off.
- Use the 25-minute focus timer, pause it, resume it, or reset it. Its clock stays accurate when a browser tab is in the background.
- Start a 25-minute focus session directly from any unfinished topic; the timer shows the selected topic and never marks it complete automatically.
- Keep a short note for each subject.
- Continue where you left off: subjects, progress, exam date, focus count, and notes are saved in this browser.
- See a seven-day study strip and current streak based only on focus sessions you finish in the timer.
- Track completed focus minutes per day and compare today's logged time with your exam-based daily target; older backups migrate without losing existing data.
- Download a versioned JSON backup or restore it on another browser; before replacing local data, restore shows the imported subject, topic and note counts for a final check.
- Clear all local study data when you need a fresh start; this also stops and resets an active focus timer.

The preview starts with sample subjects. Replace them with your own plan. There is no account, cloud sync, payment, or backend connection in the live app; browser data remains on the current device. If browser storage is blocked or full, edits stay in memory until the page is reloaded or closed.

An optional research/pilot email signup appears only when `NEXT_PUBLIC_LEADHUB_URL` is set to the shared LeadHub HTTPS origin at build time. It collects email only after a separate opt-in checkbox; study subjects, progress, and notes are never submitted.

## Run locally

```powershell
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Verify and build

```powershell
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs lint, type checks, dependency audit, and the static build for pushes and pull requests.

Next.js static export writes the deployable site to `frontend/out`. Render publishes that directory from this repository. The deployment and response headers are described in [`render.yaml`](render.yaml).

## Repository map

- `frontend/` — Next.js revision workspace and local-first browser experience.
- `backend/` — Django project scaffolding; its apps do not currently expose a study API and are not used by the live page.

## Privacy

Study data is saved under `last-minute-study.v1` in browser local storage. It is not sent to a server. Optional product recommendations require a separate checkbox and send only the product ID to LeadHub; study plans, notes, and usage activity stay on this device. Do not use a shared device for private notes. **Clear this browser’s study data** removes the locally saved plan.

## Revenue and launch status

The current product is a free individual browser app, with no account system or billing. A tutoring/coaching-provider offer remains a hypothesis that needs buyer interviews and a paid pilot before adding team features or checkout. The LeadHub form is an opt-in research channel, not a live paid offer.
