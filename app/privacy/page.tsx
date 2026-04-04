import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ShuttleSpot privacy policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 4 April 2026</p>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert space-y-8 text-sm leading-relaxed text-foreground">

        <section>
          <h2 className="text-base font-bold mb-2">1. Who we are</h2>
          <p>ShuttleSpot operates the website at shuttlespot.vercel.app. We are committed to protecting the privacy of our users in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">2. Information we collect</h2>
          <p><strong>Information you provide:</strong></p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>Account registration</strong> — name and email address when you sign in with Google, Facebook, or magic-link email</li>
            <li><strong>Venue reviews</strong> — your display name, email address (used for deduplication, not shown publicly), star rating, and written comment</li>
            <li><strong>Find Partners posts</strong> — your name, email address, skill level, and availability message. Your email is visible to other users for contact purposes.</li>
          </ul>
          <p className="mt-3"><strong>Information collected automatically:</strong></p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Browser type and device information</li>
            <li>Pages visited and time spent on the platform</li>
            <li>Approximate location (if you grant permission) — used only to show nearby venues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">3. How we use your information</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>To operate and improve the ShuttleSpot service</li>
            <li>To display venue reviews and partner availability to other users</li>
            <li>To authenticate your account and prevent fraud</li>
            <li>To send transactional emails (sign-in links, confirmations) — no marketing emails without explicit consent</li>
          </ul>
          <p className="mt-3">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">4. Data storage and security</h2>
          <p>Your data is stored on Supabase (hosted on AWS in ap-southeast-2, Sydney). We use industry-standard encryption in transit (TLS) and at rest. Authentication is handled by Supabase Auth — we never store passwords.</p>
          <p className="mt-2">We retain your data for as long as your account is active. You may request deletion at any time (see section 7).</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">5. Cookies</h2>
          <p>We use essential cookies only — specifically for session authentication (managed by Supabase Auth). We do not use tracking or advertising cookies. You can disable cookies in your browser, but authentication features will not work.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">6. Third-party services</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>Google Maps API</strong> — used to display maps and venue locations. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-primary underline-offset-2 hover:underline">Google&apos;s Privacy Policy</a>.</li>
            <li><strong>Google / Facebook OAuth</strong> — if you choose to sign in with these providers, you are also subject to their respective privacy policies.</li>
            <li><strong>Supabase</strong> — our database and authentication provider. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-primary underline-offset-2 hover:underline">Supabase Privacy Policy</a>.</li>
            <li><strong>Vercel</strong> — hosting provider that may collect request logs. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-primary underline-offset-2 hover:underline">Vercel Privacy Policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">7. Your rights</h2>
          <p>Under the Australian Privacy Principles, you have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for Find Partners listings (your posts will be removed)</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, email <a href="mailto:hello@shuttlespot.com.au" className="text-primary underline-offset-2 hover:underline">hello@shuttlespot.com.au</a>.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">8. Children&apos;s privacy</h2>
          <p>ShuttleSpot is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with their information, please contact us to have it removed.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">9. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify users of material changes by updating the date at the top of this page. Continued use of the service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">10. Contact</h2>
          <p>Privacy questions or complaints: <a href="mailto:hello@shuttlespot.com.au" className="text-primary underline-offset-2 hover:underline">hello@shuttlespot.com.au</a></p>
        </section>

      </div>

      <div className="mt-12 border-t pt-6 flex gap-6 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link>
        <Link href="/" className="hover:text-foreground transition">Back to ShuttleSpot</Link>
      </div>
    </div>
  );
}
