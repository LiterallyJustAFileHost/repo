"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

async function loadBuildVersion(setBuild: (v: string) => void) {
  try {
    const res = await fetch("/build.txt");
    if (!res.ok) throw new Error("build.txt not found");
    const text = await res.text();
    const cleaned = text.replace(/[^\x20-\x7E]/g, "").trim();
    const latest = cleaned.slice(0, 7) || "DEV";
    setBuild(latest);
  } catch (err) {
    console.warn("couldn't load build version", err);
  }
}

export function Footer() {
  const [build, setBuild] = useState("UNKNOWN");

  useEffect(() => {
    loadBuildVersion(setBuild);
  }, []);

  return (
    <motion.footer
      initial={{ opacity: "10%" }}
      whileHover={{ opacity: "25%" }}
      transition={{ duration: 0.2 }}
      className="text-center flex flex-col gap-1 mb-4"
    > <p>Made by <Link href="/team">LiterallyJustAFileHost</Link> with love. ❤️ <span className="mx-2">&#47;&#47;</span> Build{" "}
        <a
          href={`https://github.com/LiterallyJustAFileHost/repo/commit/${build}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-3"
        >
          {build}
        </a>
      </p>
      <div className="flex flex-row gap-2 justify-center underline underline-offset-3">
        <Link href="/faq" prefetch={true}>FaQ</Link>
        <Link href="/terms-of-service" prefetch={true}>Terms of Service</Link>
        <Link href="/privacy-policy" prefetch={true}>Privacy Policy</Link>
      </div>
    </motion.footer>
  )
}
