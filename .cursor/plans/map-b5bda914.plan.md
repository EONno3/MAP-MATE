<!-- b5bda914-dcb3-48ba-bc19-d64dffe4ffb2 78f460b8-9e27-4499-8fd4-1ec8626327dc -->
# Sector-Aware Metroidvania Generator

## Scope

- Backend AI (`packages/backend-ai`) gains deterministic sector clustering, grid snapping, and gating.
- Backend API consumes updated schema without breaking clients.
- Frontend visualizes new sectors (colors already supported) and handles metadata gracefully.
- Tests, metrics exports, and docs updated.

## Steps

1) **Design & Metrics Baseline**

- Document desired sector rules (zones, hub/branch ratios, key/lock flow) in `packages/backend-ai/README.md` and `PROMPT_FLOW_ANALYSIS.md`.
- Extract metrics from current generator (density, average edge length, component count) and save baseline logs via script.
- Define target thresholds (density ≥ 0.05, connectivity=1, boss depth, loop ratio) and write them down in spec.

2) **Algorithm Core Update**

- In `packages/backend-ai/main.py` (or dedicated module), refactor generation pipeline:
- Stage 1: sector allocation (k clusters, assign target room counts/types).
- Stage 2: hub graph skeleton (MST + near loops) with gating plan (key/lock pairs, entry order).
- Stage 3: grid placement with min room size (≥2×2) and bounding box scaling.
- Stage 4: zone clustering to keep same-sector rooms adjacent.
- Ensure deterministic seeding and ability unlock ordering.
- Expose metrics (density, avg edge, loop ratio) in response metadata for debugging.

3) **Validation & Repair Loop**

- Implement metric checks; if any fail (density too low, disconnected components, boss depth incorrect), perform compacting/repairs or rerun placement with capped retries.
- Update fallback logic to use new sector-aware layout when AI fails.

4) **Integration with Backend API**

- Adjust `packages/backend-api/src/routes/projects.ts` to accept new metadata (sector ids, gating info) and persist it.
- Ensure fallback draft builder matches new minimal rules (2×2 rooms, clustered placement).

5) **Testing & QA**

- Add unit tests in backend-ai (pytest) covering metric calculator, sector assignment, gating order.
- Add integration tests in backend-api to confirm density/connectedness thresholds.
- Create sample prompt golden files (snapshots) in `packages/backend-ai/datasets/prompt_cases.json` for regression.

6) **Frontend Verification**

- Verify `DraftGraphView` renders new metadata (sector colors, gating annotations) without layout regressions.
- Optionally add toggle to visualize sector clusters/border outlines for QA.

7) **Documentation & Handoff**

- Update `AI_USAGE_GUIDE.md`, `AI_FEATURE_USAGE_GUIDE_KR.md`, and `PROMPT_FLOW_ANALYSIS.md` with new pipeline.
- Provide metrics dashboard instructions/log script for future validation.

## Deliverables

- Updated generator code + tests + docs.
- Baseline metric report before/after.
- Instructions for QA to reproduce sector-aligned outputs.

### To-dos

- [ ] Fix API key delivery FE→BE→AI and verify logs
- [ ] Refactor fallback draft to grid layout and varied room sizes
- [ ] Simplify AI UX: remove redundant checkbox; single source of truth
- [ ] Add user-facing error toast and show source ai/fallback
- [ ] Add/adjust integration tests for AI payload & fallback layout
- [ ] Add unit tests for useGenerateDraft payload mapping
- [ ] Update AI usage guide for new UX flow