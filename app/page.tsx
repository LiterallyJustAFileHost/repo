import { MoveUpRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      <header className="flex flex-row py-12 px-[20%] items-center">
        <p>Logo</p>
        <button className="ml-auto flex flex-row gap-1 items-center"><MoveUpRight size={16} /> Sign Up</button>
      </header>
    </div>
  );
}
