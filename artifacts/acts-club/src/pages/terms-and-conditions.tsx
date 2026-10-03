import { LegalList, LegalPageShell, LegalPlaceholder, LegalSection } from '@/components/LegalPageShell';

export function TermsAndConditionsPage() {
  return (
    <LegalPageShell title="Terms & Conditions | ACTS Club" description="Read the ACTS Club Terms & Conditions covering membership, community conduct, opportunities, events and services.">
      <p>Welcome to ACTS Club, a community for freelancers, creators and entrepreneurs operated by GrowItBuddy.</p>
      <p>By accessing the ACTS website, submitting a membership application or participating in ACTS, you agree to these Terms &amp; Conditions.</p>

      <LegalSection title="1. About ACTS">
        <p>ACTS is a community ecosystem that may provide members with access to:</p>
        <LegalList items={['Networking', 'Collaboration opportunities', 'Freelance and project opportunities', 'Events and meetups', 'Creative challenges', 'Learning opportunities', 'Community activities', 'Opportunities shared by GrowItBuddy', 'Other member benefits introduced from time to time']} />
      </LegalSection>

      <LegalSection title="2. Membership">
        <p>ACTS membership is subject to the applicable membership process and approval requirements.</p>
        <p>The current membership fee displayed on the website is ₹99.</p>
        <p>Membership does not guarantee:</p>
        <LegalList items={['Employment', 'Freelance work', 'Clients', 'Projects', 'Income', 'Business opportunities', 'Selection for any specific opportunity']} />
        <p>ACTS provides access to a community and opportunities ecosystem, not guaranteed professional outcomes.</p>
      </LegalSection>

      <LegalSection title="3. Membership Approval">
        <p>Submitting payment does not automatically guarantee acceptance into ACTS.</p>
        <p>ACTS may review submitted information before approving membership.</p>
        <p>Membership may be declined or restricted where information appears inaccurate, fraudulent, misleading or inconsistent with ACTS community requirements.</p>
        <p>Where a refund is applicable, it will be handled according to the applicable refund policy communicated by ACTS.</p>
      </LegalSection>

      <LegalSection title="4. Accurate Information">
        <p>Members must provide accurate information when joining ACTS.</p>
        <p>Members must not:</p>
        <LegalList items={['Impersonate another person', 'Submit false information', 'Misrepresent professional experience', "Use another person's portfolio or work as their own", 'Provide misleading credentials']} />
      </LegalSection>

      <LegalSection title="5. Community Conduct">
        <p>Members are expected to maintain a respectful, professional and constructive environment.</p>
        <p>Members must not:</p>
        <LegalList items={['Harass, threaten or bully others', 'Discriminate against other members', 'Send spam', 'Run scams or fraudulent schemes', 'Share illegal content', 'Share sexually explicit or inappropriate content', "Misuse another member's personal information", 'Send unwanted promotional messages', 'Attempt to manipulate or exploit other members', 'Damage or disrupt the ACTS community', 'Engage in unlawful activity through ACTS']} />
        <p>ACTS may restrict or remove members who violate these requirements.</p>
      </LegalSection>

      <LegalSection title="6. Opportunities and Projects">
        <p>ACTS may share opportunities from:</p>
        <LegalList items={['GrowItBuddy', 'Brands', 'Agencies', 'Founders', 'Companies', 'Community members', 'Other third-party organisations']} />
        <p>ACTS does not guarantee selection for any opportunity.</p>
        <p>The relevant client, company or project owner may independently determine:</p>
        <LegalList items={['Selection', 'Scope of work', 'Compensation', 'Deadlines', 'Contract terms', 'Other project requirements']} />
        <p>Members are responsible for reviewing project terms before accepting any opportunity.</p>
      </LegalSection>

      <LegalSection title="7. GrowItBuddy Opportunities">
        <p>ACTS members may be considered for relevant creative opportunities with GrowItBuddy.</p>
        <p>Being an ACTS member does not guarantee selection for GrowItBuddy projects or employment.</p>
        <p>Selection may depend on skill, portfolio, availability, project requirements, experience and other relevant factors.</p>
      </LegalSection>

      <LegalSection title="8. Events and Activities">
        <p>ACTS may organise:</p>
        <LegalList items={['Meetups', 'Networking events', 'Workshops', 'Challenges', 'Board game sessions', 'Trips', 'Retreats', 'Online activities']} />
        <p>Certain events may require separate registration or payment.</p>
        <p>Members must follow event-specific rules and safety instructions.</p>
      </LegalSection>

      <LegalSection title="9. Third-Party Services and Benefits">
        <p>ACTS may provide access to or information about third-party services, software, tools or member benefits.</p>
        <p>Availability, duration, eligibility and terms may vary.</p>
        <p>Third-party services remain subject to the respective provider's terms, policies and availability.</p>
        <p>ACTS does not guarantee continued availability of any third-party benefit.</p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>The ACTS name, branding, website design, original content and materials are owned by or licensed to GrowItBuddy or ACTS and may not be copied, reproduced or commercially exploited without permission.</p>
        <p>Members retain ownership of content and work they create, subject to any separate agreement applicable to that work.</p>
      </LegalSection>

      <LegalSection title="11. Member-Generated Content">
        <p>By submitting content to ACTS, members are responsible for ensuring that they have the necessary rights and permissions to share that content.</p>
        <p>Members must not upload or distribute content that infringes another person's intellectual property, privacy or other legal rights.</p>
      </LegalSection>

      <LegalSection title="12. Suspension or Termination">
        <p>ACTS may suspend, restrict or terminate a member's access if the member:</p>
        <LegalList items={['Violates these Terms', 'Violates Community Guidelines', 'Provides fraudulent information', 'Misuses member information', 'Engages in harmful or unlawful activity', 'Attempts to scam or exploit other members', 'Creates a significant risk to the ACTS community']} />
      </LegalSection>

      <LegalSection title="13. Changes to ACTS">
        <p>ACTS may add, modify, replace or discontinue features, events, benefits or community channels from time to time.</p>
        <p>We may also update these Terms when reasonably necessary.</p>
      </LegalSection>

      <LegalSection title="14. Limitation of Liability">
        <p>ACTS is a community and networking platform.</p>
        <p>We do not guarantee any specific professional, financial, employment, business or personal outcome from membership.</p>
        <p>To the extent permitted by applicable law, ACTS and GrowItBuddy will not be responsible for indirect or consequential losses arising from participation in the community or from third-party opportunities or services.</p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>For questions regarding these Terms:</p>
        <p>Email: <LegalPlaceholder>[INSERT OFFICIAL EMAIL]</LegalPlaceholder><br />Website: <LegalPlaceholder>[INSERT WEBSITE]</LegalPlaceholder></p>
      </LegalSection>
    </LegalPageShell>
  );
}

export default TermsAndConditionsPage;