import { Globe, MoveUpRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      <header className="flex flex-row pt-12 px-[20%] items-center">
        <p>Logo</p>
        <button className="ml-auto flex flex-row gap-1 items-center main-button"><MoveUpRight size={16} /> Sign Up</button>
      </header>
      <main className="text-center flex flex-col gap-5 my-40">
        <h1 className="text-7xl">File Hosting, <del className="decoration-4 text-taupe-500 decoration-white">without a catch</del></h1>
        <p>An open-source, transparent, privacy-focused file hosting service with many quality of life features that competitors don&apos;t have.</p>
        <div className="flex flex-row gap-2 mt-2">
          <button className="ml-auto flex flex-row gap-1 items-center main-button"><Globe size={16}/> Try Now</button>
          <button className="mr-auto">Sign In</button>
        </div>
      </main>
      <hr className="mx-[5dvw] border-2 opacity-50"></hr>
      <div className="text-center flex flex-col items-center gap-5 my-20">
        <h2 className="text-5xl">Less worrying, more storing</h2>
        <p>Literally Just A File Host offers <span className="text-accent">2.5x</span> more storage than competitors, and growing.</p>
        <div className="flex flex-col gap-2 w-[30dvw] mt-2">
          <div className="bg-accent w-full text-left pl-2 flex flex-row">
            <p>Us</p>
            <p className="ml-auto mr-2 opacity-75">25GB</p>
          </div>
          <div className="bg-red-500 w-[80%] text-left pl-2 opacity-25 flex flex-row">
            <p>MEGA</p>
            <p className="ml-auto mr-2 opacity-75">20GB</p>
          </div>
          <div className="bg-blue-700 w-[40%] text-left pl-2 opacity-25 flex flex-row">
            <p>MediaFire</p>
            <p className="ml-auto mr-2 opacity-75">10GB</p>
          </div>
          <div className="bg-blue-600 w-[8%] text-left pl-[8%] opacity-25 flex flex-row">
            <p className="ml-1.5">DropBox</p>
            <p className="ml-2 opacity-75">2GB</p>
          </div>
        </div>
      </div>
      <hr className="mx-[5dvw] border-2 opacity-50"></hr>
    </div>
  );
}
