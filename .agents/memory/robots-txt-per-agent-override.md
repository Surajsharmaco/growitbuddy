---
name: robots.txt per-user-agent block override
description: Why per-bot robots.txt blocks must repeat global Disallow rules
---

In robots.txt, a crawler obeys ONLY the most specific matching `User-agent` block. Once a bot has its own named block (e.g. `User-agent: GPTBot`), it ignores the `User-agent: *` wildcard block entirely — including any `Disallow` rules there.

**Why:** When adding explicit "allow AI crawlers" blocks (GEO/AEO), a block containing only `Allow: /` silently re-grants access to paths the wildcard block disallowed (e.g. `/admin`, `/verify/`), defeating the intended crawl policy.

**How to apply:** Repeat every global `Disallow` line inside each named bot block, or omit per-bot blocks and rely on the wildcard if the policy is uniform.
