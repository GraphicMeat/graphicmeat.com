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


## 2026-07-14 — PhotoBooks + graphicmeat.com (localization: nine languages)
Drew from: PhotoBooks' large recent burst localizing the whole app via String Catalogs into the "Big 8" (de fr es it ja ko zh-Hans pt-BR) + English — per-feature catalog sweeps (SetupFeature, ExportFeature, DocumentUI, EditorFeature, BookBrowser), verbatim handling for numeric accessibility values/separators, pruning dead/orphan keys, plus an App Store release pipeline and localized store screenshots. graphicmeat.com matched it same-week by localizing the /photobooks marketing page and adding a language picker. First localization/i18n beat in the log; distinct from 07-13 (curation) and the sda routing/map runs. No client specifics needed here.

Draft:
> Localized the photobook app into nine languages. Translation was the easy part — the real work was the edges: numbers that must stay verbatim, separators, accessibility values, pruning dead keys. Still wild that one person can ship in 9 languages now. #buildinpublic #SwiftUI

## 2026-07-15 — sda (route-cost calculator: domain complexity, kept abstract)
Drew from: sda's last ~36h — building a standalone /calculator page (waypoints, geocode, pins, preview, result cards) that prices a route with toll fares, truck-profile compliance rules, and a real fleet default. Notable sub-details: a fix to charge the cheapest toll fare rather than the sum of alternatives, and multiple perf commits gating/capping route+rule geometry so compliance never freezes the UI. Also fresh but not the chosen beat: direction-of-travel heading arrows on truck markers (incl. parked/last-known), route-history reuse on new tasks, and a new graphicmeat.com "MR. Ukis multilingual storefront" page. Chose the calculator angle — first cost/pricing beat in the log, distinct from the recent localization (07-14) and curation (07-13) runs and from earlier sda document-extraction/map beats. No client/tenant/driver specifics per instructions.

Draft:
> A route is never just distance. Building a standalone cost calculator, the hard part was tolls with multiple fare options (you want the cheapest, not the sum) and compliance rules so heavy they froze the UI until I capped the geometry. #buildinpublic #logistics

## 2026-07-16 — PhotoBooks (cross-platform: Mac-first app onto iPhone/iPad)
Drew from: PhotoBooks' last ~36h — bringing the (originally Mac-first) app to iOS: swapping in native PhotosPicker for photo selection on iOS+macOS, gating macOS window min-sizes and stacking source cards on narrow screens, fixing an iOS build (lock args to PhotoActionsInlineOverlay), fixing a Replace/Swap photo dead-end (auto-open tray + Add from Library), and an iPad reorder toolbar button for the regular-width page browser. sda also had activity (calculator recent-addresses dropdown, parked-truck heading arrows, route-history reuse) but 07-15 already covered sda and PhotoBooks' cross-platform push is the fresher, unused angle. First cross-platform/iOS-adaptation beat in the log — distinct from 07-13 curation and 07-14 localization.

Draft:
> Bringing the photobook app to iPhone this week — it's all the small adaptations: a layout built for a Mac window has to stack for a narrow screen, swap in the native photo picker, and stop dead-ending flows that assumed a mouse. Same app, different hands. #SwiftUI #indiedev

## 2026-07-17 — sda (live-map heading / "live" vs last-known, kept abstract)
Drew from: sda's recent (~last few days) map work — direction-of-travel heading arrows next to truck markers, and keeping the last-known heading on parked/idle trucks. No fresh 36h sda commit today (PhotoBooks had iOS bug-fixes, but that repeats 07-16's cross-platform beat; graphicmeat.com localized remaining pages, repeats 07-14). Chose the heading angle: first-time beat about the gap between "live" and "last-known" on a real-time map. Distinct from 07-11 pin-label toggle, 07-15 cost calculator, 07-12 fuel-POI merge. No client/tenant/driver specifics.

Draft:
> On a live fleet map a truck isn't just a dot — it's pointing somewhere. Added heading arrows for direction of travel, and kept the last-known heading on parked trucks. "Live" turns out to be a stack of last-knowns you hope are recent enough. #buildinpublic #logistics

## 2026-07-18 — graphicmeat.com + mail-vault-app (self-hosted first-party analytics)
Drew from: this cycle's meatlytics work spanning two repos — a self-hosted, first-party analytics engine added to both graphicmeat.com and the MailVault website: passkey login (dropped ANALYTICS_PASS), country stats + live world map, admin subscribers endpoint, AGPL-relicensed history, site privacy page disclosing the self-hosted analytics, plus deploy/env provisioning behind Caddy. First analytics/privacy/self-hosting beat in the log — distinct from 07-17 heading arrows, 07-16 cross-platform, 07-15 cost calculator, 07-14 localization. No client specifics involved.

Draft:
> Instead of dropping a third-party tracker into my sites, I built and self-hosted my own analytics — first-party, passkey login, no data sold on. Now shared across every product. More work, but I own the numbers and visitors aren't the product. #buildinpublic #selfhosted

## 2026-07-19 — PhotoBooks (release/distribution machinery)
Drew from: PhotoBooks' recent release-pipeline work — localized iOS metadata upload workflow, a private screenshot upload pipeline, and a build that fails when the generated project is stale. Only fresh 36h commits today were graphicmeat.com meatlytics bumps (passkey login, subscribers endpoint, world map) — same self-hosted-analytics theme as 07-18, so skipped to avoid repeating a beat two runs in a row. Chose the shipping-machinery angle: first release/distribution/build-hygiene beat in the log — distinct from 07-18 analytics, 07-16 cross-platform iOS, 07-14 localization. No client specifics.

Draft:
> Shipping solo, the part nobody shows isn't the app — it's the machinery around it. This week: App Store release plumbing. Automated metadata upload, a screenshot pipeline, a build that fails if the project's stale. Unglamorous, and the reason it ships. #buildinpublic #SwiftUI

## 2026-07-20 — graphicmeat.com + mail-vault-app (deploys eating their own data)
Drew from: the only fresh commits across all five repos (~36h) — both sites: rsync deploy excludes for data/ and analytics.db after a deploy wiped the analytics database, a Caddy matcher fix so /gm/* didn't fall through to static index.html, plus meatlytics bumps (passkey invite links, platform stats: browser/OS/device/language). PhotoBooks, pressureCooker and sda were quiet. Related to 07-18 (self-hosted analytics) and 07-19 (release machinery) but a distinct beat: the failure mode where stateless-deploy habits destroy the state a self-hosted service accumulates. No client specifics.

Draft:
> Self-hosting lesson, learned the hard way: my deploy script rsynced the app folder clean and deleted the analytics database it had been filling for days. Owning your data also means your deploys can eat it. Excludes added, lesson kept. #buildinpublic #selfhosted
