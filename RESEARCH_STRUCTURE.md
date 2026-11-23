# Research portfolio structure — 23 November 2026

This site uses the owner's approved horizontal botanical design: **five full-screen scenes per research page, Wikimedia photographic flower cutouts, 150 independently animated flowers per scene, and the original flower-petal scene transitions.**

## Visitor navigation

- `index.html`: personal home, ABOUT, original floral five-scene layout
- `research.html`: primary five-scene research introduction, links to the original four research programmes and the full subject directory
- `start-here.html`: no-equations entry for visitors without a quantum physics background
- `research-branches.html`: navigation map across the additional subject branches
- `researcher.html`: the researcher's background, motivation, current research programmes and research standards

## Central five-scene programmes

- `qtrac.html`: Quantum Temporal Reconstruction
- `ximeste-maluna.html`: finite-state mathematics and the Ximeste–Maluna programme
- `physical-records.html`: thermal information and reversible-interference physics directions
- `publications.html`: technical records, manuscript status and public source links

## Added research branches

### QTRAC — quantum temporal verification
- `quantum-memory.html`: constrained quantum/classical storage, operational success and fair resource comparisons
- `observation-order.html`: how the sequence of contact affects accessible records and memory cost
- `future-questions.html`: evidence encoding before the question to be answered is known

### Finite mathematics
- `critical-curve.html`: Ximeste–Maluna **arity q × state size n critical-curve conjecture**, explicitly open as a general classification
- `probabilistic-circuits.html`: a **separate, related** programme on dyadic stochastic matrices, fair-coin circuit synthesis, depth and memory

### Physical information
- `thermal-records.html`: physical write/evolve/read tasks and later distinguishability in thermal systems
- `directional-interference.html`: directional reversal signals, spatial kernels and inverse-model identifiability

### Independent related questions
- `quantum-software.html`: quantum compiler checking, contract-aware test oracles and reproducible case studies
- `human-mobility.html`: separate data-driven research interest in movement patterns, uncertainty, representation and privacy

## Scientific representation policy

1. Do not label an open conjecture, conditional statement, finite computation or exploratory physics model as a generally proved or independently reproduced physical law.
2. In particular, Ximeste–Maluna's arity–state-size critical curve and dyadic exact-synthesis questions are not interchangeable.
3. QTRAC is a research programme about **operational future verification**. It does not guarantee full recovery of an arbitrarily erased history.
4. Software verification and human mobility are related by methodological interests, not proven corollaries of quantum temporal reconstruction.
5. Distinguish *research question*, *constructive example*, *draft / internally checked statement*, *independently verified theorem*, *public manuscript*, and *peer-reviewed publication*.
6. Never invent paper acceptance, research priority, official university sponsorship, DOI or experimental detection.

## Design protection / implementation

**Never edit the following without a new express owner instruction:**

`photo-garden.js`, `photo-garden.css`, `dark-garden.css`, `styles.css`, original HOME scene structure, and the approved petal-slide transition.

Added research branches are ordinary HTML pages containing **five static, readable `.branch-chapter` source sections**. The new `research-branch-builder.js` converts only those pages to the original `.slide` scene structure *before* the unchanged `photo-garden.js` runs. Site copy remains in HTML for easier maintenance and search indexing. `research-access.css` adds beginner-friendly side-by-side explanation cards. `research-reading.js` allows a reader to scroll detailed text inside a slide without unexpectedly advancing the horizontal scene. The original four detailed research pages additionally link to subtopics.

`research-wayfinding.css` is scoped to the original research overview's extra links. None of these additions changes the original botanical assets or animations.

## SEO

Canonical URLs and descriptions are set in each page. `sitemap.xml` lists **18** pages (home + overview + four original details + twelve additional branches).

## Backups

- Approved original: `approved-baseline-home-and-horizontal-research-2026-11-23`
- Pre-extension backup: `backup-before-accessible-expanded-research-2026-11-23`
- Earlier four-page snapshot: `snapshot-four-research-programmes-horizontal-2026-11-23`

When updating a page, preserve the five-scene structure and create a new snapshot branch before significant changes.
