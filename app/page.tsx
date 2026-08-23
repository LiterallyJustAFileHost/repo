import { Globe, MoveUpRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      <header className="flex flex-row pt-12 pb-24 px-[20%] items-center">
        <p>Logo</p>
        <button className="ml-auto flex flex-row gap-1 items-center main-button"><MoveUpRight size={16} /> Sign Up</button>
      </header>
      <main className="text-center flex flex-col gap-5">
        <h1 className="text-7xl">File Hosting, <del className="decoration-4 text-taupe-500 decoration-white">without a catch</del></h1>
        <p>An open-source, transparent, privacy-focused file hosting service with many quality of life features that competitors don&apos;t have.</p>
        <div className="flex flex-row gap-2 mt-2">
          <button className="ml-auto flex flex-row gap-1 items-center main-button"><Globe size={16}/> Try Now</button>
          <button className="mr-auto">Sign In</button>
        </div>
      </main>
    </div>
  );
}
