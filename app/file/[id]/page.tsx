"use client";

export default function SharedFilePage() {
  return (
    <div className="px-[15dvw] py-8">
      <div className="flex flex-row">
        <h1 className="text-2xl underline underline-offset-6 decoration-(--surface-4) font-bold">Files</h1>
        <div className="flex flex-col ml-auto">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">somethingsomething.zip <span className="text-sm text-(--surface-4)">67MB</span></h2>
            <button className="main-button ml-auto">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}
