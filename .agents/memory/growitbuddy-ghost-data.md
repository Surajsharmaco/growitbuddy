---
name: GrowitBuddy admin ghost-data resurrection
description: Why admin list editors re-seeded deleted/demo content, and the fail-closed load pattern that prevents it.
---

# Ghost-data resurrection in admin editors

Symptom: content a user deleted in the admin panel reappears ("refresh pe purani
cheezein wapas aa jaati hain"), especially after a transient content-API hiccup.

Root cause: a list editor initialised its user-deletable arrays from DEFAULT_*
demo constants AND did not distinguish a *failed* content read from an *empty*
one. If the initial GET failed (network / non-2xx / JSON parse), the editor still
mounted holding the DEFAULT_* demo items; the next Save then PUT those demo items
over the real section — resurrecting deleted/demo content (this ships to the live
site, so it is silent prod data loss).

Fix pattern — apply to any admin editor that saves user-deletable arrays:
- Initialise user-deletable arrays to `[]`, never to DEFAULT_* demo data.
- Distinguish outcomes: 200 with null/empty data = "empty"; non-2xx / network /
  throw = "failure". (In this app `getContentResult(section)` returns `{ok,data}`;
  `ok=false` on `!res.ok` or throw, else `{ok:true, data: row.data ?? null}`.)
- Fail closed: model load as `"loading" | "error" | "ready"` and do NOT render the
  editor or ANY Save action unless state === "ready". On error show a Retry only.
- Put the ready-guard BEFORE every other early-return (e.g. an "is editing"
  branch) so no Save path is reachable after a failed load.
- Taxonomy/constants that are NOT user-deletable (genres/countries/niches) may
  stay seeded from constants; only overwrite them when the payload contains them.

**Why:** prod ships from this dev code via user-gated GitHub push; a clobbering
Save after a failed read is silent data loss on the live site.

**How to apply:** any new admin editor saving deletable arrays must reuse this
fail-closed loader. NOT yet applied (known follow-up) to the single-object
DEFAULTS editors (Home/About/Contact/Footer/Navbar) and to AdminLinks.sections,
AdminNetworkForm, AdminTalentPool, and PageVisibilityCard (merges `{}` after a
failed read) — they share the same clobber class.
