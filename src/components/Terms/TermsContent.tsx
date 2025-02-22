import React from 'react';
import { TermsSection } from './TermsSection';

const sections = [
  {
    title: "Introduction",
    content: "BraidsNow.com LLC is a booking website and registry for braiders, locticians, and all stylists who reside in the USA and specialize in Black hair styles and textures. BraidsNow.com is also a stylist registry for clients seeking new stylists and is a resource for all things braids and black hair. Hairstylists will herein be referred to as \"Stylists\". Both clients and stylists are users of BraidsNow.com LLC services and are hereinafter referred to accumulatively as \"Users.\""
  },
  {
    title: "Service Description",
    content: "BraidsNow.com LLC exclusively provides a platform for Stylists and Clients to connect and serves only as a means of communication to promote and expedite the provision of Styling Services. BraidsNow.com LLC does not contract for or provide Styling Services. Stylists and Clients independently contract for the provision of Styling Services. Clients are entirely responsible for selecting the Stylist, the Styling Services to be provided and the location at which Styling Services will be performed, whether at a site of the Stylist's choosing, or one selected by the Client. Any decision by a Client to receive Styling Services or by a Professional to provide Styling Services is a decision made in such person's sole discretion and at their own risk. All Users understand and acknowledge that BraidsNow.com does not conduct background checks on Clients and any provision of Services taking place at a private location fundamentally increases the risks involved for both Stylists and Clients."
  },
  {
    title: "Disclaimer of Warranties",
    content: "BraidsNow.com LLC has no control over the worthiness, adequacy, quality, reliability, longevity, legality, punctuality, failure to provide, or any other facet whatsoever of any Styling Services provided by Stylists nor of the responsibility, integrity or any of the actions or omissions whatsoever of any Clients or Stylists. BraidsNow.com doesn't guarantee availability of any services searched for by Clients. BraidsNow.com LLC makes no warranties or representations whatsoever with respect to Styling Services offered or provided by Stylists or requested by Clients through use of the Services, whether in private, public, or offline exchanges, or about the licensing, registration or certifications of any Professional."
  },
  {
    title: "Registration Process",
    content: "Rights are granted to use BraidsNow.com LLC services when an account is created by a User and Users are subject to the restrictions established in these Terms and Conditions of Service and any other conditions specified to you by BraidsNow.com in writing. Registering on BraidsNow.com requires Users to provide information (User Registration Data) including name and other personal information. When registering for an Account, you agree to provide correct, truthful, complete and current information about yourself as prompted by the BraidsNow.com registration process and as requested periodically by BraidsNow.com LLC."
  },
  {
    title: "User ID",
    content: "After registering on BraidsNow.com site as a User, you will receive a username and password in connection with your Account hereinafter referred to as User ID. It is mandatory for you to use your full correct first and last name when signing up for an Account. You are then required to select an appropriate username. The username should be expressive name that clearly reflects who you are and what services you perform."
  },
  {
    title: "Account Security",
    content: "You agree to solely maintain your Account for your own individual use only. You agree to not allow your User ID to be used by another person to access or use the Services under any circumstances. You are entirely responsible for keeping your account information confidential and for any liabilities, damages, charges, or losses experienced or suffered as a result of you failing to keep your information confidential."
  },
  {
    title: "Terminations",
    content: "Under the circumstances that your Account is suspended or terminated for any or no reason, you agree: (a) To stop using the services immediately (b) To be bound by the Terms and Conditions of the services continuously (c) That we have no obligation but reserve the right to delete or hide all of your User Account Data and information stored on our servers, and (d) That BraidsNow.com LLC shall not be liable to you or any third party for termination or suspension of access to the Services or for hiding or cancelling of your User Account Data or information."
  },
  {
    title: "Customer Service",
    content: "Stylists are individually and fully responsible for all customer service issues relating to their provided goods or services. Styling Services, pricing, rebates, order fulfillment, order or appointment cancellation, refunds, returns and adjustments, functionality and warranty, and feedback concerning experiences with the Stylist, any personnel, their policies or processes are all the total responsibility of the Stylists without limitation. Stylists are a completely separate entity from BraidsNow.com LLC."
  },
  {
    title: "Dispute Resolution",
    content: "In order to resolve any disputes related to these Terms and Conditions of Service, you and BraidsNow.com agree to first attempt to negotiate any Dispute (except those Disputes expressly excluded below) informally for at least thirty (30) days before initiating any arbitration or court proceeding. Such informal negotiations will commence upon written notice."
  },
  {
    title: "Binding Arbitration",
    content: "If you and BraidsNow.com LLC are unable to resolve a Dispute through informal negotiations, all claims arising from use of the Services (except those Disputes expressly excluded below) shall be finally and exclusively resolved by binding arbitration. Any election to arbitrate by one party will be final and binding on the other. YOU UNDERSTAND THAT IF EITHER PARTY ELECTS TO ARBITRATE, NEITHER PARTY WILL HAVE THE RIGHT TO SUE IN COURT OR HAVE A JURY TRIAL."
  },
  {
    title: "Governing Law",
    content: "These Terms of Service will be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights."
  },
  {
    title: "Indemnification",
    content: "You agree to defend, indemnify and hold harmless the Company and its affiliates, officers, directors, employees, agents, partners and licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, debt and expenses (including but not limited to attorney's fees) arising from or relating to: (i) your use of and access to the Services; (ii) Styling Services facilitated by the Services or any interaction between you and another user; (iii) your violation of any term of these Terms of Service; (iv) your violation of any rights of a third party, including without limitation any copyright, intellectual property, or privacy right; or (v) any third-party claims or damages relating to death, personal injury or emotional distress arising from or related to use of the Services. This defense and indemnification obligations will survive the termination of these Terms of Service and your use of the Services."
  },
  {
    title: "Privacy",
    content: "Our collection of data and information via the Services from Users and others is subject to our Privacy Policy which is available at https://BraidsNow.com LLC.com/privacy/ and is incorporated herein (the \"Privacy Policy\"). You understand that through your use of the Services that you consent to the collection and use (as set forth in the Privacy Policy) of such data and information. By using the Services, you may receive information about Clients or other third parties. You must keep such information confidential and only use it in connection with the Services. You may not disclose or distribute any such information to a third party or use the information for marketing purposes unless you receive the express consent of the Client or other third party."
  },
  {
    title: "Security",
    content: "Our collection of data and information via the Services from Users and others is subject to our Privacy Policy which is available at https://BraidsNow.com LLC.com/privacy/ and is incorporated herein (the \"Privacy Policy\"). You understand that through your use of the Services that you consent to the collection and use (as set forth in the Privacy Policy) of such data and information. By using the Services, you may receive information about Clients or other third parties. You must keep such information confidential and only use it in connection with the Services. You may not disclose or distribute any such information to a third party or use the information for marketing purposes unless you receive the express consent of the Client or other third party."
  }
] as const;

export function TermsContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <div className="space-y-12">
        {sections.map((section) => (
          <TermsSection 
            key={section.title} 
            title={section.title} 
            content={section.content} 
          />
        ))}
      </div>
    </div>
  );
}