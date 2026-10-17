
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "../components/footer";

const team = [
  {
    name: "Flux3tor",
    role: "Co-creator",
    description:
      "Works on the backend.",
    github: "https://github.com/Flux3tor",
  },
  {
    name: "Sabio",
    role: "Co-creator",
    description:
      "Works on the frontend.",
    github: "https://github.com/SabioOfficial",
  },
];

export default function TeamPage() {
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

        <section className="text-center py-20 flex flex-col gap-4 items-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest">
            The people behind the project
          </p>
          <h1 className="text-5xl md:text-7xl font-black">Meet the team.</h1>
          <p className="max-w-2xl opacity-75 leading-7">
            Literally Just A File Host is built by people who want file hosting
            to be straightforward, useful, and open source.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {team.map((member) => (
            <article
              key={member.name}
              className="rounded-xl border border-(--surface-2) p-7 flex flex-col gap-4"
            >
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-accent text-sm mt-1">{member.role}</p>
              </div>
              <p className="opacity-75 leading-7 flex-1">
                {member.description}
              </p>
              <Link
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 underline underline-offset-4 w-fit"
              >
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="white">
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </Link>
            </article>
          ))}
        </section>

        <section className="text-center mt-20">
          <h2 className="text-2xl font-bold">Built in the open.</h2>
          <p className="opacity-75 mt-3">
            Explore the source code and follow the project on GitHub.
          </p>
          <Link
            href="https://github.com/LiterallyJustAFileHost/repo"
            target="_blank"
            rel="noopener noreferrer"
            className="main-button inline-flex items-center gap-2 px-4 py-2 mt-5"
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="white">
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Project repository
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
