# Domain logic

Pure, framework-free TypeScript: room geometry, collision detection, snapping,
clearance rules, budget totals and validation of AI operations.

- No React, three.js or Firebase imports. ESLint enforces this
  (`no-restricted-imports` in the root `eslint.config.js`).
- Every module is unit tested. Geometry rules also run the shared JSON cases in
  `shared/fixtures`, the same cases the API's Python implementation runs.
