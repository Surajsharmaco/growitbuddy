// CODE default content for each public page, aggregated so the SSR function can
// render the SAME "current content" the live site shows even when a page has NO
// admin override row in the DB (e.g. /about, /blog, /framework). The client gets
// these defaults by importing each *Defaults module and merging {...defaults,
// ...db} (see usePublicContent); the DB-only SSR could not, so default-only pages
// rendered an empty <body>. This restores parity.
//
// Keyed by the SAME section keys the body renderer walks: the registry slug plus
// the EXTRA_CONTENT_SECTIONS keys in render.ts. Keep this in lockstep with those.
//
// Pure-data modules ONLY (object/array literals, no React/DOM) so esbuild can
// bundle them into the serverless function. Relative paths because the bundler
// has no "@/" alias.
import { HOME_DEFAULTS } from "../src/lib/homeDefaults";
import { ABOUT_DEFAULTS } from "../src/lib/aboutDefaults";
import { CONTACT_DEFAULTS } from "../src/lib/contactDefaults";
import { SERVICES_DEFAULTS } from "../src/lib/servicesDefaults";
import { WORK_DEFAULTS } from "../src/lib/workDefaults";
import { FRAMEWORK_DEFAULTS } from "../src/lib/frameworkDefaults";
import { AUTHORITY_AUDIT_DEFAULTS } from "../src/lib/authorityAuditDefaults";
import { INFLUENCER_EXPLORE_DEFAULTS } from "../src/lib/influencerExploreDefaults";
import { DISTRIBUTION_NETWORK_DEFAULTS } from "../src/lib/distributionNetworkDefaults";
import { FULLTIME_DEFAULTS } from "../src/lib/fulltimeDefaults";
import { INTERNSHIP_DEFAULTS } from "../src/lib/internshipDefaults";
import { FREELANCERS_DEFAULTS } from "../src/lib/freelancersDefaults";
import { CREATOR_SCHOOL_DEFAULTS } from "../src/lib/creatorSchoolDefaults";
import { RESOURCES_DEFAULTS } from "../src/lib/resourcesDefaults";
import { PRIVACY_DEFAULTS } from "../src/lib/privacyDefaults";
import { TERMS_DEFAULTS } from "../src/lib/termsDefaults";
import { LINKS_DEFAULTS } from "../src/lib/linksDefaults";
import { JOIN_NETWORK_DEFAULTS } from "../src/lib/joinNetworkDefaults";
import {
  CREATORS_FORM_DEFAULTS,
  PAGE_OWNER_FORM_DEFAULTS,
} from "../src/lib/networkFormDefaults";

export const CONTENT_DEFAULTS: Record<string, unknown> = {
  home: HOME_DEFAULTS,
  about: ABOUT_DEFAULTS,
  contact: CONTACT_DEFAULTS,
  services: SERVICES_DEFAULTS,
  work: WORK_DEFAULTS,
  framework: FRAMEWORK_DEFAULTS,
  "authority-audit": AUTHORITY_AUDIT_DEFAULTS,
  "influencer-explore": INFLUENCER_EXPLORE_DEFAULTS,
  "distribution-network": DISTRIBUTION_NETWORK_DEFAULTS,
  // User-deletable list: NEVER fall back to demo data. When the DB has no rows
  // (e.g. SSR can't reach the DB), an empty list is the correct answer — the
  // client fills it from the live API. Demo defaults here resurrected deleted
  // pages in the crawler body / first paint.
  "distribution-pages": { items: [] },
  links: LINKS_DEFAULTS,
  joinnetwork: JOIN_NETWORK_DEFAULTS,
  // User-deletable list: empty fallback (never demo posts), same reason as above.
  blog: { posts: [] },
  fulltime: FULLTIME_DEFAULTS,
  internship: INTERNSHIP_DEFAULTS,
  freelancers: FREELANCERS_DEFAULTS,
  "creator-school": CREATOR_SCHOOL_DEFAULTS,
  resources: RESOURCES_DEFAULTS,
  privacy: PRIVACY_DEFAULTS,
  terms: TERMS_DEFAULTS,
  "creators-form": CREATORS_FORM_DEFAULTS,
  "page-owner-form": PAGE_OWNER_FORM_DEFAULTS,
};
