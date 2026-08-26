"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, MoveUpRight } from "lucide-react";
import { animate, motion, useInView } from "framer-motion";
import Link from "next/link";

async function loadBuildVersion(setBuild: (v: string) => void) {
  try {
    const res = await fetch("/build.txt");
    if (!res.ok) throw new Error("build.txt not found");
    const text = await res.text();
    const cleaned = text.replace(/[^\x20-\x7E]/g, "").trim();
    const latest = cleaned.slice(0, 7) || "DEV";

    const cached = localStorage.getItem("build");
    if (latest !== cached) {
      setBuild(latest);
      try {
        localStorage.setItem("build", latest);
      } catch (storageErr) {
        console.warn("couldn't persist build cache", storageErr);
      }
    }
  } catch {
  }
}

interface CountUpProps {
  from: number;
  to: number;
  duration: number;
}

function CountUp({ from, to, duration }: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (!inView) return;
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate(value) {
        node.textContent = Math.round(value).toString();
      },
    });

    return () => controls.stop();
  }, [inView, from, to, duration]);

  return <span ref={nodeRef}>{from}</span>;
}

export default function Home() {
  const cachedBuild = typeof window !== "undefined" ? localStorage.getItem("build") : null;
  const [build, setBuild] = useState(cachedBuild || "???????");

  useEffect(() => {
    loadBuildVersion(setBuild);
  }, []);

  return (
    <div>
      <header className="flex flex-row pt-12 px-[20%] items-center absolute w-dvw">
        <img/>
        <p>LiterallyJustAFileHost</p>
        <button className="ml-auto flex flex-row gap-1 items-center main-button"><MoveUpRight size={16} /> Sign Up</button>
      </header>
      <main className="text-center flex flex-col justify-center gap-5 h-dvh">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-7xl"
        >
          File Hosting, <del className="decoration-4 text-accent decoration-white">without a catch</del>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          An open-source, transparent, privacy-focused file hosting service with many quality of life features that competitors
          <span className="text-accent"> don&apos;t have</span>.
        </motion.p>
        <div className="flex flex-row gap-4 mt-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="ml-auto"
          >
            <button className="flex flex-row gap-1 items-center main-button"><Globe size={16} /> Try Now</button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mr-auto"
          >
            <button className="mr-auto">Sign In</button>
          </motion.div>
        </div>
      </main>
      <hr className="mx-[5dvw] border-2 opacity-10"></hr>
      <div className="flex flex-row gap-10 justify-center my-20">
        <div className="text-left flex flex-col gap-3">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-5xl"
          >Less worrying, more storing</motion.h2>
          <p>Literally Just A File Host offers <span className="text-accent">12.5x</span> more storage than some competitors, and growing.</p>
        </div>
        <div className="flex flex-col gap-2 w-[30dvw] mt-2">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-accent pl-2 flex flex-row overflow-hidden whitespace-nowrap"
            title="A higher storage limit will be implemented as we grow."
          >
            <p>LiterallyJustAFileHost <span className="opacity-75">(Us)</span></p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="ml-auto mr-2 opacity-75"
            ><CountUp from={0} to={25} duration={2}/>GB</motion.p>
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-red-800 pl-2 flex flex-row overflow-hidden whitespace-nowrap"
            title="MEGA offers 20% less than LiterallyJustAFileHost."
          >
            <p>MEGA</p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="ml-auto mr-2 opacity-75"
            ><CountUp from={0} to={20} duration={2}/>GB</motion.p>
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "40%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-blue-700 pl-2 flex flex-row overflow-hidden whitespace-nowrap"
            title="MediaFire offers 60% less than LiterallyJustAFileHost."
          >
            <p>MediaFire</p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="ml-auto mr-2 opacity-75"
            ><CountUp from={0} to={10} duration={2}/>GB</motion.p>
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "8%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-blue-600 flex flex-row" title="DropBox offers 92% less than LiterallyJustAFileHost."
          >
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="ml-12"
            >DropBox</motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="ml-2 opacity-75"
            ><CountUp from={0} to={2} duration={2}/>GB</motion.p>
          </motion.div>
        </div>
      </div>
      <hr className="mx-[5dvw] border-2 opacity-10"></hr>
      <div className="text-center flex flex-col items-center gap-5 mt-20 mb-40">
        <h2 className="text-5xl"><CountUp from={0} to={100} duration={2}/>% free and open-sourced, forever</h2>
        <p>
          This file hoster is completely free and open-sourced, <span className="text-accent">forever</span>.
          What we do with your data is to host it, <span className="text-accent">not to sell it</span>.
        </p>
        <div className="flex flex-row gap-2">
          <a href="https://github.com/LiterallyJustAFileHost/repo" target="_blank">
            <button className="main-button flex flex-row gap-1.5 items-center">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="white">
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </button>
          </a>
          <Link href="/pricing" prefetch={true}><button>&quot;Pricing&quot;</button></Link>
        </div>
      </div>
      <footer className="text-center flex flex-col gap-1.5 mb-4">
        <p>Made by <Link href="/team">LiterallyJustAFileHost</Link> with love. ❤️ <span className="mx-2">&#47;&#47;</span> Build {build}</p>
        <div className="flex flex-row gap-2 justify-center underline underline-offset-3">
          <Link href="/faq" prefetch={true}>FaQ</Link>
          <Link href="/terms-of-service" prefetch={true}>Terms of Service</Link>
          <Link href="/privacy-policy" prefetch={true}>Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
