import Link from "next/link";
import { ArrowLeft, ShieldCheck, HardDrive, Heart } from "lucide-react";
import { Footer } from "../components/footer";

const values = [
  {
    icon: HardDrive,
    title: "Built for sharing",
    description:
      "A straightforward place to upload files, organize them, and share them through links.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy matters",
    description:
      "Your files are here to be hosted, not sold. We aim to be transparent about how the service handles your data.",
  },
  {
    icon: Heart,
    title: "Free and open source",
    description:
      "Literally Just A File Host is free to use and open source, with its code available for everyone to explore.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 px-6 md:px-[15%] pb-20">
        <header className="pt-8">
          <Link href="/" className="main-button flex w-fit items-center gap-2 px-4 py-2">
            <ArrowLeft size={16} />
            Home
          </Link>
        </header>

        <section className="text-center flex flex-col items-center gap-5 py-20">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest">
            A little about us
          </p>
          <h1 className="text-5xl md:text-7xl font-black">
            Literally Just A File Host.
          </h1>
          <p className="max-w-2xl text-lg opacity-75">
            File hosting should be simple. Upload your files, share them when
            you need to, and get on with your day. No unnecessary complications.
          </p>
          <Link
            href="https://github.com/LiterallyJustAFileHost/repo"
            target="_blank"
            rel="noopener noreferrer"
            className="main-button flex items-center gap-2 px-4 py-2"
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="white">
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Explore the source
          </Link>
        </section>

        <section className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-4">Why we built this</h2>
          <p className="opacity-80 leading-7">
            Literally Just A File Host is an open-source, privacy-focused file
            hosting service built around making file sharing straightforward.
            We want the essentials to work well, with useful features and
            transparent practices rather than unnecessary friction.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mt-16">
          {values.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-xl border border-(--surface-2) p-6 flex flex-col gap-4"
            >
              <Icon size={26} className="text-accent" />
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="opacity-75 leading-6">{description}</p>
            </article>
          ))}
        </section>

        <section className="text-center mt-20 flex flex-col items-center gap-4">
          <h2 className="text-3xl font-bold">Want to take a look?</h2>
          <p className="opacity-75">
            The project is open source. Check out the code or try the service.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth" className="main-button px-4 py-2">
              Try the service
            </Link>
            <Link
              href="https://github.com/LiterallyJustAFileHost/repo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 underline underline-offset-4"
            >
              View on GitHub
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
