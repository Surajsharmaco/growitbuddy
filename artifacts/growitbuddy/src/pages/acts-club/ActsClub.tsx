import SEOMeta from "@/components/SEOMeta";
import { findEntryBySlug, SITE_URL, BRAND } from "@/lib/pageRegistry";
import "./acts.css";
import { Nav, Hero, Proof, Platform, Ecosystem } from "./Top";
import { Life, Opportunities, GrowItBuddy, Story, Stories, Join, Footer } from "./Bottom";

export default function ActsClub() {
  const entry = findEntryBySlug("acts-club");
  const title = entry?.defaults.title ?? "ACTS Club: Community for Creators & Freelancers";
  const description = entry?.defaults.description ?? "";
  const url = `${SITE_URL}/acts-club`;
  const schema = [
    { "@type": "Organization", "@id": `${url}#org`, name: "ACTS Club", url, parentOrganization: { "@id": `${SITE_URL}/#organization`, name: BRAND.name }, description },
    { "@type": "CollectionPage", "@id": `${url}#page`, url, name: title, description, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${url}#org` } },
  ];
  return (
    <div className="acts" data-testid="page-acts-club">
      <SEOMeta title={title} description={description} canonical={url} schema={schema} />
      <Nav />
      <main>
        <Hero />
        <Proof />
        <Platform />
        <Ecosystem />
        <Life />
        <Opportunities />
        <GrowItBuddy />
        <Story />
        <Stories />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
