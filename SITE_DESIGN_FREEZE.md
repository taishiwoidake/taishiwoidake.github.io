# Website Design Freeze — Approved Floral Editions

**Owner directive (23 November 2026):** The floral website is approved. Preserve the approved versions and do not alter their design, content, photo animations, petal-blizzard transitions, slide layout, or background palette without a new, specific request from the owner.

## Current approved edition — Deep Green Petal Blizzard

- **Approved snapshot commit:** `78368d0cd680ed8d649c2539f18398cad436215a`
- **Frozen recovery branch:** `frozen-deep-green-petal-blizzard-2026-11-23`
- Design: five horizontally navigated scenes, 150 individually animated real-photo flowers per scene, petal-blizzard slide transitions, wrap-around navigation, all backgrounds in dark khaki, olive, moss and forest green.
- Palette override: `dark-garden.css` (loaded after the existing style sheets).
- The approved transition and individual-flower code in `photo-garden.js` must be preserved unless a new explicit request changes it.
- **Restore:** compare with or restore the frozen recovery branch. Never rewrite the recovery branch itself.

## Previous approved editions (also preserved)

1. **Petal-blizzard edition before recoloring**
   - Commit: `cc3a93c811b630268165601e43094b818568360b`
   - Recovery branch: `frozen-petal-blizzard-2026-11-23`
   - Original flower-by-flower motion plus the approved petal-blizzard slide transition; original pale scene palette.
2. **Original flower-ballet edition**
   - Commit: `ee1ee361c023fd8e5478e611399bbaab4253e636`
   - Recovery branch: `frozen-flower-ballet-2026-11-23`
   - Original approved individual flower choreography.
3. **Before transition updates**
   - Commit: `99e947f9ad468b12d4e338535e4c840a4142b0fb`
   - Backup branch: `backup-before-floral-transitions-2026-11-23`

## Change policy

An explicit owner instruction may authorize a focused change. Change only what is requested and preserve all unrelated visual and behavioral properties. Create a new recovery snapshot for any newly approved edition, and leave earlier recovery branches intact. Exploratory remarks, background maintenance and unrelated contributions are not authorization to redesign.

These are Git recovery branches and documentation, **not immutable branch-protection rules**. A repository administrator can still alter them. Protect them with GitHub rulesets if administrative controls become available.

Website: https://taishiwoidake.github.io/
Repository: https://github.com/taishiwoidake/taishiwoidake.github.io
