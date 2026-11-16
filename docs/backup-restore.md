# Study backup restore

Cramwise backups use a versioned JSON envelope. Restore accepts the supported format only, then shows the number of subjects, topics, and non-empty notes before asking to replace the current browser-local plan.

The preview is a quick check against choosing the wrong file. It does not upload or inspect study content outside the browser. Keep a downloaded backup somewhere safe before restoring; restore replaces the current plan. Empty backups remain valid so a learner can intentionally restore a cleared workspace.

Checks: `cd frontend; npm run test:state; npm run lint; npm run typecheck; npm run build`.
