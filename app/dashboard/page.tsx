"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, MoveUpRight, SearchIcon } from "lucide-react";
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

export default function Home() {
  const cachedBuild = typeof window !== "undefined" ? localStorage.getItem("build") : null;
  const [build, setBuild] = useState(cachedBuild || "???????");

  useEffect(() => {
    loadBuildVersion(setBuild);
  }, []);

  return (
    <div>
      <header className="bg-surface px-8 py-4 flex flex-row gap-12 items-center border-b border-(--surface-2)">
        <div>
          <img/>
          <p className="text-2xl font-black">Your Drive</p>
        </div>
        <div className="flex flex-row items-center gap-2 border rounded-lg border-(--surface-2) px-3 py-0.75 grow max-w-[50dvw] mx-auto">
          <SearchIcon size={16}/>
          <input placeholder="Search in your Drive" className="placeholder-(--surface-2)"/>
        </div>
        <img width={32} height={32} className="rounded-full cursor-pointer"/>
      </header>
      <main>
        <div>

        </div>
      </main>
    </div>
  );
}
