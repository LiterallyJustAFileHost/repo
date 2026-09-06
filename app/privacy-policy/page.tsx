import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-1.5 [&_h2]:mt-4 px-[20dvw] pb-[6dvh]">
      <header>
        <a href="./"><button className="main-button flex flex-row gap-1 mx-auto mt-8 font-bold items-center justify-center w-fit"><ArrowLeft/> Home</button></a>
      </header>

      <div className="text-center py-[6dvh] flex flex-col gap-2">
        <h1 className="text-6xl font-black">Privacy Policy</h1>
        <p>Last updated on Sunday, September 6th 2026.</p>
      </div>

      <p>
        This privacy policy explains what personal data we collect when you use the Service, why we collect it, and your rights over it. It should be read alongside
        our separate Terms of Service.
      </p>

      <h2>1. Who We Are</h2>
      <p>
        The Service is operated by Sabio Tang and Tushar Sinha (together, the &quot;Operators&quot;, &quot;we&quot;, &quot;us&quot;). For questions about this
        Policy or your data, contact legal@literallyjustafilehost.com.
      </p>

      <h2>2. What We Collect</h2>
      <p>
        When you create an account, we collect your name, email address, and (if you sign in via a third-party provider) a profile image. If you sign in with GitHub,
        Google, or Hack Club Auth, that provider shares this data with us as part of authentication.<br />
        We store OAuth account links (which provider you signed in with, and an internal account identifier), and session records including your IP address and
        browser/device user agent string, used to keep you signed in and to secure your account.<br />
        When you upload a file, we store the file itself, its file name, file type, file size, folder structure (if you organize files into folders), and a unique
        identifier used to generate share links. Files are stored using our cloud storage provider (see Section 3).<br />
        If we send you a transactional email (e.g. account verification, password reset, or a service notice), that email is sent via our third-party email provider
        (see Section 3).<br />
        We do not collect payment information, as the Service is free. We do not run advertising or analytics tracking beyond what&apos;s described above.
      </p>

      <h2>3. Why We Collect It, and Who We Share It With</h2>
      <p>
        We use your data to run the Service: creating and securing your account; storing and serving your files; sending you necessary account-related emails. We
        also use session and login data (like IP address) to help keep the Service and your account secure. Where we&apos;re legally required to, we may disclose
        data to the relevant authorities.<br />
        We do not sell your personal data. We share it only with the third-party providers necessary to operate the Service:
      </p>
      <table className="w-full text-left [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b-2 [&_td]:border-(--surface-2) my-4">
        <thead>
          <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-(--surface-3) [&>th]:border-b-2 [&>th]:border-(--surface-1)">
            <th>Provider</th>
            <th>Purpose</th>
            <th>Data involved</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GitHub / Google / Hack Club Auth</td>
            <td>Sign-in / authentication</td>
            <td>Name, email, profile image, OAuth tokens</td>
          </tr>
          <tr>
            <td>Google Drive</td>
            <td>File storage</td>
            <td>Uploaded files, file metadata</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Transactional email delivery</td>
            <td>Email address, email content</td>
          </tr>
          <tr>
            <td>Neon</td>
            <td>Database hosting</td>
            <td>All account and file metadata</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each provider processes data under its own privacy policy and terms. We choose providers that we believe handle data responsibly, but we do not control
        their infrastructure or practices.
      </p>

      <h2>4. Where Your Data Is Stored</h2>
      <p>
        We use providers based in the United States (including Google, GitHub, and Resend), so your data is likely to be stored and processed outside your own
        country.
      </p>

      <h2>5. How Long We Keep Your Data</h2>
      <p>
        We retain your account and file data for as long as your account remains active. If you delete a file, we delete it (and its associated metadata) within
        1 year. If you delete your account, we delete your account and file data within 1 year, except where we&apos;re required to retain limited records for
        legal, security, or dispute-resolution purposes, as described in our Terms of Service.<br />
        Session records (IP address, user agent) are retained only for as long as as needed for security purposes and are periodically deleted or expired
        automatically.
      </p>

      <h2>6. Your Rights</h2>
      <p>Depending on where you live, you may have rights including the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Delete your data (&quot;right to be forgotten&quot;).</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent, where processing is based on consent.</li>
      </ul>
      <p>
        You can exercise most of these rights directly within the Service. For anything else, contact us at contact@literallyjustafilehost.com. If you&apos;re in the
        EU or UK, you also have the right to lodge a complaint with your local data protection authority (in the UK, the ICO).
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        The Service is not directed at children under 13, and use by anyone under 13 is not permitted, consistent with our Terms of Service. We do not knowingly
        collect personal data from children under 13. If you believe a child has provided us with personal data, contact us at contact@literallyjustafilehost.com so
        we can delete it.
      </p>

      <h2>8. Security</h2>
      <p>
        We take reasonable technical and organizational measures to protect your data, including relying on providers with their own security practices. However, no
        method of transmission or storage is completely secure, and we cannot guarantee absolute security, consistent with the disclaimers in our Terms of Service.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may change this Policy from time to time. If we make a material change, we will make reasonable efforts to notify you, such as by posting a notice in the
        Service or emailling you. Continued use of the Service after a change takes effect constitutes acceptance of the revised Policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions or requests regarding this Policy or your personal data can be sent to contact@literallyjustafilehost.com.
      </p>
    </div>
  )
}
