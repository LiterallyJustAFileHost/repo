"use client";

import { useEffect, useState } from "react";
import { CopyIcon, DownloadCloudIcon, FolderIcon, SearchIcon, Triangle, UploadIcon } from "lucide-react";

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
      <main className="flex flex-col gap-4 px-8 py-8">
        <div className="flex flex-row gap-3">
          <button className="flex flex-row gap-2 items-center colourless-main-button rounded-lg! px-6! py-2.5! text-sm"><UploadIcon size={20} /> Upload</button>
          <button className="flex flex-row gap-2 items-center bg-(--surface-2) rounded-lg! px-6! py-2.5! text-sm hover:bg-(--surface-3) transition-default"><FolderIcon size={20} /> New Folder</button>
          <div className="flex flex-col gap-1 ml-auto">
            <p className="text-right">972MB out of 25GB used</p>
            <div className="w-[20dvw] h-[25%] bg-(--surface-2) rounded-full overflow-hidden">
              <div className="w-[3.888%] bg-(--surface-3) h-full"></div>
            </div>
          </div>
        </div>
        <table className="w-full text-left [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-b-2 [&_td]:border-(--surface-2) [&_td]:text-lg">
          <thead>
            <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-(--surface-3) [&>th]:border-b-2 [&>th]:border-(--surface-1)">
              <th><p className="flex flex-row gap-1.5 items-center">Type <Triangle size={12} fill="currentColor" className="cursor-pointer rotate-180"/></p></th>
              <th><p className="flex flex-row gap-1.5 items-center">Name <Triangle size={12} fill="currentColor" className="cursor-pointer rotate-180"/></p></th>
              <th><p className="flex flex-row gap-1.5 items-center">Uploaded <Triangle size={12} fill="currentColor" className="cursor-pointer rotate-180"/></p></th>
              <th><p className="flex flex-row gap-1.5 items-center">Size <Triangle size={12} fill="currentColor" className="cursor-pointer rotate-180"/></p></th>
              <th><p>Actions</p></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td title="Portable Network Graphics (PNG)">PNG</td>
              <td title="Placeholder.png">Placeholder</td>
              <td title="August 29th 2026, 11:04:59 GMT+0100">August 29th, 11:04</td>
              <td title="13,943KB">13.9MB</td>
              <td>
                <div className="flex flex-row items-center gap-2">
                  <DownloadCloudIcon size={20} className="cursor-pointer" />
                  <CopyIcon size={20} className="cursor-pointer" />
                </div>
              </td>
            </tr>
            <tr>
              <td title="QuickTime File Format">MOV</td>
              <td title="Placeholder2.mov">Placeholder2</td>
              <td title="August 19th 2026, 14:51:02 GMT+0400">10d ago</td>
              <td title="893,207KB">893MB</td>
              <td>
                <div className="flex flex-row items-center gap-2">
                  <DownloadCloudIcon size={20} className="cursor-pointer" />
                  <CopyIcon size={20} className="cursor-pointer" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
