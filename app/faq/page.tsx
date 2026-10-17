import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Footer } from "../components/footer";

const faqs = [
  {
    question: "What is Literally Just A File Host?",
    answer:
      "Literally Just A File Host is a free, open-source file hosting service designed to make uploading, organizing, and sharing files straightforward.",
  },
  {
    question: "Is the service free?",
    answer:
      "Yes. The service is free to use. Each account has a storage quota, and the amount available may vary depending on the account.",
  },
  {
    question: "How much storage do I get?",
    answer:
      "Your storage quota is shown in your dashboard and settings. Quotas can vary by account, so check your current usage there for the exact limit.",
  },
  {
    question: "Who can access my uploaded files?",
    answer:
      "New files are inaccessible by default unless you change your default visibility preference. You can change an individual file's visibility between Inaccessible and Accessible from your dashboard.",
  },
  {
    question: "How do I share a file?",
    answer:
      "Make sure the file is set to Accessible, then copy its share link from your dashboard. Inaccessible files cannot be downloaded through the public share endpoint.",
  },
  {
    question: "What is the difference between a share link and a CDN link?",
    answer:
      "A share link opens the file's share page. A CDN link provides a direct delivery URL. CDN link copying is unavailable while a file is inaccessible.",
  },
  {
    question: "Can I change the default visibility of new uploads?",
    answer:
      "Yes. Open Settings and change the default visibility preference. The preference applies to new uploads, while existing files can be changed individually.",
  },
  {
    question: "Are my files and personal data sold?",
    answer:
      "No. The service states that it does not sell your personal data. Read our Privacy Policy to learn what information is collected and which providers help operate the service.",
  },
  {
    question: "Where can I report a problem or suggest a feature?",
    answer:
      "You can explore the project's source code and repository on GitHub. Check the repository for the available ways to report bugs or suggest improvements.",
  },
  {
    question: "Is Literally Just A File Host open source?",
    answer:
      "Yes. The project is open source, and its source code is available on GitHub.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 px-6 md:px-[15%] pb-20">
        <header className="pt-8">
          <Link
            href="/"
            className="main-button flex w-fit items-center gap-2 px-4 py-2"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </header>

        <section className="text-center py-16 flex flex-col gap-4 items-center">
          <h1 className="text-5xl md:text-6xl font-black">
            Frequently Asked Questions
          </h1>
          <p className="max-w-2xl opacity-75">
            Got questions? Here are some answers about using Literally Just A
            File Host.
          </p>
        </section>

        <section className="max-w-3xl mx-auto flex flex-col gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-(--surface-2) p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {faq.question}
                <ChevronDown
                  size={18}
                  className="shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-4 opacity-75 leading-7">{faq.answer}</p>
            </details>
          ))}
        </section>

        <section className="text-center mt-16 flex flex-col gap-3 items-center">
          <p className="opacity-75">
            Still have questions? Check our policies for more information.
          </p>
          <div className="flex flex-wrap justify-center gap-4 underline underline-offset-4">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link
              href="https://github.com/LiterallyJustAFileHost/repo"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
