import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-extrabold text-sm">
              R
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">RestoBuddy</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <article className="prose prose-neutral dark:prose-invert prose-orange max-w-none">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Terms of Service</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing our website and using RestoBuddy (a service provided by Sygmia Innovative), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials (information or software) on RestoBuddy for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on the website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. Subscriptions and Payments</h2>
            <p>
              RestoBuddy offers subscription-based services. By subscribing to our services, you agree to pay all applicable fees and taxes. We reserve the right to change our pricing, but will provide adequate notice of any changes. Subscription fees are non-refundable except as required by law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Restaurant Responsibilities</h2>
            <p>
              As a restaurant partner, you are solely responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>The quality, safety, and delivery of the food and beverages offered through our platform.</li>
              <li>Complying with all applicable local health, safety, and food standards regulations.</li>
              <li>Fulfilling customer orders promptly and accurately.</li>
              <li>Handling customer disputes, refunds, and complaints related to your products.</li>
            </ul>
            <h3 className="text-xl font-semibold mb-3 mt-6">Data Privacy & Communications</h3>
            <p className="mb-4">
              Restaurants shall use customer information solely for order fulfillment, customer support, and lawful business communications. Restaurants are responsible for complying with applicable privacy and data protection laws.
            </p>
            <p>
              Restaurants are solely responsible for any marketing, promotional, or communication activities conducted using customer information obtained through the platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Disclaimer</h2>
            <p>
              The materials on RestoBuddy's website are provided on an 'as is' basis. Sygmia Innovative makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-xl mt-4">
              <p className="font-bold mb-2">Sygmia Innovative</p>
              <p><strong>Email:</strong> <a href="mailto:info@sygmiainnovative.co.in" className="text-orange-600">info@sygmiainnovative.co.in</a></p>
              <p><strong>Phone:</strong> +91 77601 33445 / +91 70023 09306</p>
              <p className="mt-4"><strong>Office Locations:</strong></p>
              <ul className="list-disc pl-6">
                <li>Bangalore, Karnataka-IN</li>
                <li>Tezpur, Assam-IN</li>
                <li>Dibrugarh, Assam-IN</li>
              </ul>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
