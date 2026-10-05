import { LegalList, LegalPageShell, LegalPlaceholder, LegalSection } from '@/components/LegalPageShell';
import { ActsContactLinks } from '@/components/ActsContactLinks';

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy | ACTS Club" description="Read the ACTS Club Privacy Policy, including how member information is collected, used, stored and protected.">
      <p>This Privacy Policy explains how ACTS Club, operated by GrowItBuddy (“ACTS”, “we”, “us”, or “our”), collects, uses, stores and protects information provided by visitors and members of ACTS Club.</p>
      <p>By using the ACTS website or submitting information to join ACTS, you acknowledge this Privacy Policy.</p>

      <LegalSection title="1. Information We Collect">
        <p>When you interact with ACTS or apply for membership, we may collect information such as:</p>
        <LegalList items={['Full name', 'Contact number', 'WhatsApp number', 'City', 'Instagram ID or social profile', 'Freelancer, creator or entrepreneur category', 'Creator type, where applicable', 'Primary skill', 'Other information submitted through the membership form', 'Membership and payment information', 'Transaction reference and payment status', 'Information voluntarily provided during your participation in ACTS']} />
        <p>We only request information that is reasonably necessary for operating the ACTS community and providing relevant services and opportunities.</p>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We may use your information to:</p>
        <LegalList items={['Process your ACTS membership application', 'Verify and review membership applications', 'Create and maintain your ACTS member profile', 'Contact you regarding your membership', 'Provide access to ACTS community channels', 'Share relevant opportunities', 'Facilitate networking and collaborations', 'Organise events, meetups, workshops and challenges', 'Provide member benefits', 'Communicate important ACTS updates', 'Improve ACTS services and user experience', 'Prevent fraud, spam, abuse and misuse', 'Comply with applicable legal obligations']} />
      </LegalSection>

      <LegalSection title="3. Member Profiles">
        <p>ACTS may maintain member profiles to help facilitate networking, collaboration and opportunities.</p>
        <p>Only appropriate information may be displayed publicly or within the ACTS community.</p>
        <p>Sensitive personal information such as your phone number, WhatsApp number or other private contact information will not be intentionally displayed publicly unless you have provided appropriate permission or it is necessary for a specific service or activity.</p>
      </LegalSection>

      <LegalSection title="4. Sharing of Information">
        <p>We may share relevant information with:</p>
        <LegalList items={['GrowItBuddy team members', 'ACTS administrators', 'Technology and service providers helping us operate ACTS', 'Payment processors', 'Event or project partners where reasonably necessary', 'Companies, brands, founders or clients where you voluntarily apply for or participate in an opportunity']} />
        <p>We do not sell your personal information as a product.</p>
      </LegalSection>

      <LegalSection title="5. Payments">
        <p>Payments may be processed through third-party payment providers such as Razorpay.</p>
        <p>We may receive information such as:</p>
        <LegalList items={['Payment status', 'Amount paid', 'Transaction reference', 'Basic payment-related information']} />
        <p>We do not intentionally collect or store your complete card details, UPI PIN, banking password or other sensitive payment credentials.</p>
      </LegalSection>

      <LegalSection title="6. WhatsApp and Third-Party Platforms">
        <p>ACTS may use WhatsApp or other third-party platforms for community communication.</p>
        <p>When you join a third-party platform, certain information may be visible to other participants according to the functionality and privacy settings of that platform.</p>
        <p>Your use of third-party platforms is also subject to their respective terms and privacy policies.</p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>We take reasonable technical and organisational measures to protect personal information against unauthorised access, misuse, alteration or disclosure.</p>
        <p>However, no online service or method of data transmission can guarantee absolute security.</p>
      </LegalSection>

      <LegalSection title="8. Data Retention">
        <p>We may retain personal information for as long as reasonably necessary to:</p>
        <LegalList items={['Provide ACTS services', 'Maintain membership records', 'Manage payments', 'Resolve disputes', 'Prevent fraud or misuse', 'Comply with applicable legal obligations']} />
      </LegalSection>

      <LegalSection title="9. Your Privacy Rights">
        <p>Subject to applicable law, you may request:</p>
        <LegalList items={['Access to your personal information', 'Correction of inaccurate information', 'Deletion of information where legally applicable', 'Information about how your data is being used', 'Withdrawal of certain permissions where applicable']} />
        <p>For privacy-related requests, contact:</p>
        <p><ActsContactLinks /></p>
      </LegalSection>

      <LegalSection title="10. Children's Privacy">
        <p>ACTS is intended for users who are legally able to enter into the applicable membership agreement.</p>
        <p>If we become aware that personal information has been collected from someone who is not permitted to use ACTS, we may take appropriate steps to remove that information.</p>
      </LegalSection>

      <LegalSection title="11. Changes to This Privacy Policy">
        <p>We may update this Privacy Policy from time to time.</p>
        <p>The latest version will always be published on this page with the relevant update date.</p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>For privacy-related questions or requests:</p>
        <p><ActsContactLinks /><br />Website: <LegalPlaceholder>[INSERT WEBSITE]</LegalPlaceholder></p>
      </LegalSection>
    </LegalPageShell>
  );
}

export default PrivacyPolicyPage;