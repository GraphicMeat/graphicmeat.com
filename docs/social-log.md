# GraphicMeat social post log (private — not shipped to public/)

## 2026-07-07 — sda (document extraction / trust)
Drew from: sda repo's recent extractor-registry / sender-classifier / source-review-panel work (900+ commits, kept abstract per instructions — no client/tenant/driver specifics).

Draft:
> Been building a parser that reads a dozen PDF layouts for one shipping order type — same fields, wildly different formats, some just scanned images. The real fix wasn't a smarter extractor, it was showing raw source text next to the parsed result so a human catches bad guesses.

## 2026-07-08 — PhotoBooks + graphicmeat.com (shipping the launch, superseded earlier draft below)
CORRECTION: first draft for today wrongly focused on pressureCooker's internal batching/concurrency commit and missed the actual news — PhotoBooks v0.2.0 shipped 2026-07-07 (notarized DMG, Sparkle auto-update), and graphicmeat.com got same-day-morning commits (~00:03–01:08) deploying the site as its own Node service and adding a real screenshot lightbox to /photobooks. That's the genuine launch beat: PhotoBooks going from private repo to a live, downloadable product with a public page.

Draft:
> PhotoBooks just went live for real: notarized build, auto-updates, real screenshots on the site instead of a private repo. The layout engine (templates vs. generative composition, scored) is still the hard part. Shipping made it feel real. #buildinpublic #indiedev #SwiftUI

(Rokas asked for tags to be added on this run — noting since the default skill guidance is no-hashtags.)

## 2026-07-09 — sda (zonal template extraction, kept abstract)
Drew from: sda's recent run of commits building a visual zonal template editor for document field extraction — draw-a-box-once workflow, then a resolver that has to keep matching the right field when labels shift position, wrap across lines, sit inside other boxes, or appear in a different language than expected. Distinct sub-angle from 07-07's post (that one was about surfacing raw text for human trust; this one is about teaching a fixed zone to survive real-world layout variance). No client/tenant/driver specifics per instructions.

Draft:
> Been teaching a document-reading system to trust zones instead of guesses — draw a box once, then make it survive labels that move, wrap, or come out in another language. Not glamorous work, but it's the gap between a demo and something that holds up on real, messy paperwork.

## 2026-07-10 — sda (auto-generated templates, kept abstract)
Drew from: sda's last ~30h of commits (only repo with new activity) building auto-generation of a first-draft zonal template from a single sample PDF, plus a color-coded "mirror" read-back (green/yellow legend) showing the extracted value next to the live PDF value so a human can visually confirm matches. Distinct sub-angle from 07-09 (that was about a hand-drawn zone surviving layout variance; this is about the labor shifting from hand-drawing/hand-coding to reviewing an auto-generated draft). No client/tenant/driver specifics per instructions.

Draft:
> Realized the real lift in a document extractor wasn't drawing boxes by hand, it's auto-generating a first-draft template from one sample PDF and letting a human nudge it into place. Writing per-client code turned into reviewing pixels. #buildinpublic #indiedev

## 2026-07-11 — sda (live fleet map, kept abstract)
Drew from: sda's only new commit in the last ~30h — adding a "waypoint" stop type and a toggle so map pins show either the step number or the stop-action's emoji (persisted per-user), plus a migration to support it. Deliberately different sub-angle from the last three days (07-07/07-09/07-10 were all document-extraction); this one is about the live routing/map side of the product instead, still kept abstract per instructions (no client/tenant/driver specifics).

Draft:
> Small map decision, real tradeoff: should a stop's pin show its order in the route, or what it actually is? Added a toggle so a live fleet map's pins flip between step numbers and action icons — same data, two ways to read it. #buildinpublic #indiedev

## 2026-07-12 — sda (fuel POI data merging, kept abstract)
Drew from: sda's last ~48h — bundling an offline all-Europe OSM fuel POI dataset (~170k stations), merging it with a commercial fuel network's overlay, deduping overlapping pins into a single popup, plus widening coverage to Europe+CIS. Fifth consecutive sda-only day; deliberately a new sub-angle (data-source reconciliation at scale) distinct from 07-11's pin-label toggle and the 07-07/09/10 document-extraction runs. Commercial network kept unnamed; no client/tenant/driver specifics per instructions.

Draft:
> Added fuel stations to a live fleet map: one commercial network's feed plus open map data — ~170k stations across Europe, bundled offline. Plotting pins was easy; merging two versions of the truth when they overlap was the actual work. #buildinpublic #indiedev

## 2026-07-13 — PhotoBooks (curation: taste as an algorithm)
Drew from: PhotoBooks' big recent burst — CurationAnalyzer near-duplicate clustering, PhotoCurator best-N selection, curation step in the new-book wizard, auto-promoting hero photos to full spreads, four new two-page spread templates. First non-sda beat since 07-08; angle is that the hard problem shifted from layout to deciding which photos deserve space at all. (sda also had a task-board redesign run, but PhotoBooks was the fresher story.)

Draft:
> Taught the photobook app to curate: cluster near-duplicates, keep the best of each burst, promote heroes to full spreads. Layout turned out to be the easy half — deciding which photos deserve space is where taste has to become an algorithm. #buildinpublic #SwiftUI

