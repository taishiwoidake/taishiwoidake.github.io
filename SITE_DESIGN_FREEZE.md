# Website Design Freeze — Approved Floral Editions

**Owner directive (23 November 2026):** The floral website is approved. Preserve the approved versions and do not alter their design, content, photo animations, petal-blizzard transitions, slide layout, or background palette without a new, specific request from the owner.

## Current approved baseline — HOME + Horizontal Research (23 November 2026)

**The owner expressly approved the current site and asked to preserve it as the foundation for all future additions.**

- **Exact approved code commit:** `987e3378b5dc32297b714af9e28bd3f389e1bc4c`
- **Primary baseline recovery branch:** `approved-baseline-home-and-horizontal-research-2026-11-23`
- **Additional identical snapshot:** `snapshot-horizontal-research-flowers-2026-11-23`
- **HOME:** https://taishiwoidake.github.io/
- **RESEARCH:** https://taishiwoidake.github.io/research.html
- **Essential invariants:** both pages retain five full-screen horizontal slides, the same 150 individually animated photo-cutout flowers per slide, flower-petal confetti between scenes, dark khaki/olive/forest green backgrounds, cyclical last-to-first/first-to-last navigation, and consistent botanical typography. The HOME "EXPLORE MY RESEARCH" link opens the separate horizontal research slideshow.
- **Research slideshow structure:** (1) Introduction, (2) Central Question, (3) Mathematical Framework, (4) Research Directions, (5) Work & Records.
- **Important:** the research site must remain **horizontal** and use the exact common `photo-garden.js` animation; do not replace it with a conventional long vertical research page.
- **Future work:** extend this approved structure with explicit additions or focused edits only. Do not silently remove or replace the flower animation, layout or navigation. Before larger changes, create another snapshot branch.
- **Recovery:** use the exact baseline branch above. Never rewrite or delete the preserved branch.

## Earlier approved edition — Deep Green Petal Blizzard

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
