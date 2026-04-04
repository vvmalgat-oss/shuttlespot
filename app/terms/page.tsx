import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ShuttleSpot terms of service — your rights and responsibilities when using the platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 April 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-foreground">

        <section>
          <h2 className="text-base font-bold mb-2">1. About ShuttleSpot</h2>
          <p>ShuttleSpot is an Australian badminton venue discovery platform that helps players find and book indoor badminton courts. We are not a booking platform — we provide venue information and direct you to venues or their booking systems. We do not process payments or guarantee availability.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">2. Acceptance of terms</h2>
          <p>By accessing or using ShuttleSpot, you agree to these Terms of Service. If you do not agree, do not use the service. We may update these terms at any time; continued use after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">3. Use of the service</h2>
          <p>You agree to use ShuttleSpot only for lawful purposes. You must not:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Post false, misleading, or defamatory venue reviews</li>
            <li>Use the platform to spam or harass other users</li>
            <li>Attempt to reverse-engineer, scrape, or interfere with the service</li>
            <li>Use another user&apos;s credentials or impersonate any person</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">4. User accounts</h2>
          <p>You may create an account using Google, Facebook, or a magic-link email. You are responsible for all activity under your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">5. User-generated content</h2>
          <p>Reviews, partner availability posts, and any other content you submit must be honest and accurate. By submitting content, you grant ShuttleSpot a non-exclusive, royalty-free licence to display it on the platform. We may remove any content at our discretion without notice.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">6. Venue information</h2>
          <p>Venue details (hours, prices, court availability) are provided for informational purposes only. We make reasonable efforts to keep information accurate but cannot guarantee it is current. Always confirm directly with the venue before travelling.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">7. Limitation of liability</h2>
          <p>To the maximum extent permitted by Australian law, ShuttleSpot is not liable for any direct, indirect, incidental, or consequential loss arising from your use of the service, including but not limited to incorrect venue information, inability to book a court, or interactions with other users.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">8. Intellectual property</h2>
          <p>All content, logos, and design elements on ShuttleSpot are owned by or licensed to us. You may not reproduce or distribute any part of the platform without prior written consent.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">9. Governing law</h2>
          <p>These terms are governed by the laws of Victoria, Australia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Victoria.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">10. Contact</h2>
          <p>Questions about these terms? Email us at <a href="mailto:hello@shuttlespot.com.au" className="text-primary underline-offset-2 hover:underline">hello@shuttlespot.com.au</a>.</p>
        </section>

      </div>

      <div className="mt-12 border-t pt-6 flex gap-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition">Privacy Policy</Link>
        <Link href="/" className="hover:text-foreground transition">Back to ShuttleSpot</Link>
      </div>
    </div>
  );
}
