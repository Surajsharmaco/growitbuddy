import { LegalList, LegalPageShell, LegalPlaceholder, LegalSection } from '@/components/LegalPageShell';

export function CommunityGuidelinesPage() {
  return (
    <LegalPageShell title="Community Guidelines | ACTS Club" description="Explore the ACTS Club Community Guidelines for respectful, genuine and constructive participation.">
      <p>ACTS is built around people, ideas, projects and opportunities.</p>
      <p>Our goal is to create a community where freelancers, creators and entrepreneurs can meet genuine people, discover opportunities, collaborate and grow.</p>
      <p>By joining ACTS, you agree to follow these guidelines.</p>

      <LegalSection title="1. Respect Everyone">
        <p>Treat other members with respect.</p>
        <p>Do not engage in:</p>
        <LegalList items={['Harassment', 'Bullying', 'Threats', 'Hate speech', 'Discrimination', 'Personal attacks']} />
      </LegalSection>

      <LegalSection title="2. No Spam">
        <p>Do not flood ACTS groups or member channels with:</p>
        <LegalList items={['Unsolicited promotions', 'Repeated advertisements', 'Irrelevant links', 'Referral spam', 'Unwanted DMs']} />
        <p>Share opportunities and promotions only where they are relevant and permitted.</p>
      </LegalSection>

      <LegalSection title="3. No Scams or Fraud">
        <p>ACTS has zero tolerance for fraudulent activity.</p>
        <p>Do not:</p>
        <LegalList items={['Fake job opportunities', 'Misrepresent yourself', 'Request money through fraudulent schemes', 'Impersonate companies or individuals', 'Use fake portfolios or credentials', 'Attempt to scam another member']} />
      </LegalSection>

      <LegalSection title="4. Respect Privacy">
        <p>Do not share another member's:</p>
        <LegalList items={['Phone number', 'WhatsApp number', 'Private messages', 'Personal information', 'Private documents']} />
        <p>without their permission.</p>
      </LegalSection>

      <LegalSection title="5. Keep Opportunities Genuine">
        <p>If you share a job, project, freelance opportunity or collaboration:</p>
        <LegalList items={['Provide accurate information', 'Do not intentionally mislead members', 'Clearly mention important requirements', 'Do not pretend to represent a company if you do not']} />
      </LegalSection>

      <LegalSection title="6. Professional Behaviour">
        <p>ACTS is a professional and creative community.</p>
        <p>Members should communicate professionally and respect different opinions, backgrounds, skills and experience levels.</p>
      </LegalSection>

      <LegalSection title="7. No Unauthorised Content">
        <p>Do not share:</p>
        <LegalList items={['Copyrighted material without permission', 'Illegal content', 'Malicious files or links', 'Explicit sexual content', 'Content intended to harm or exploit others']} />
      </LegalSection>

      <LegalSection title="8. Respect Community Spaces">
        <p>Different ACTS channels may have different purposes.</p>
        <p>Use the appropriate channel for:</p>
        <LegalList items={['Opportunities', 'Collaborations', 'Events', 'Challenges', 'Community discussions']} />
        <p>Avoid unnecessary off-topic messages.</p>
      </LegalSection>

      <LegalSection title="9. Meetups and Offline Events">
        <p>When attending an ACTS event:</p>
        <LegalList items={['Respect other participants', 'Follow event instructions', 'Take reasonable care of yourself and your belongings', 'Do not engage in threatening, abusive or illegal behaviour']} />
      </LegalSection>

      <LegalSection title="10. Report Problems">
        <p>If you experience harassment, scams, inappropriate behaviour or another serious community issue, report it to the ACTS administration team.</p>
        <p>Contact:</p>
        <p><LegalPlaceholder>[INSERT OFFICIAL EMAIL / ADMIN CONTACT]</LegalPlaceholder></p>
      </LegalSection>

      <LegalSection title="11. Enforcement">
        <p>ACTS may take appropriate action when these guidelines are violated.</p>
        <p>Depending on the situation, this may include:</p>
        <LegalList items={['Warning', 'Content removal', 'Temporary restriction', 'Removal from a specific community channel', 'Suspension', 'Permanent removal from ACTS']} />
        <p>Serious violations may result in immediate removal.</p>
      </LegalSection>

      <LegalSection title="12. The Standard We Want">
        <p>ACTS should be a place where:</p>
        <p>People meet people.<br />Ideas become projects.<br />Skills create opportunities.<br />Members help each other move forward.</p>
        <p className="font-bold text-ink">Be respectful. Be genuine. Add value.</p>
      </LegalSection>
    </LegalPageShell>
  );
}

export default CommunityGuidelinesPage;