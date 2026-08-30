"use client";

import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
  const handleHackClubAuth = async () => {
    await authClient.signIn.social({
      provider: "hackclub",
      callbackURL: "/dashboard",
    });
  };

  const handleGoogleAuth = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleGitHubAuth = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="flex h-dvh">
      <div className="h-[90dvh] w-full flex flex-row mx-[8dvw] my-auto bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-2xl">
        <div className="flex flex-col gap-3 w-fit h-full p-[3dvw] border-r-4 border-[rgba(255,255,255,0.12)]">
          <h1 className="text-4xl font-bold">SIGN UP</h1>
          <p>Powered by LiterallyJustAFileHost</p>
        </div>

        <div className="flex flex-col gap-4 justify-center w-full p-[3dvw]">
          <button
            onClick={handleHackClubAuth}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] mx-[10dvw] backdrop-blur-lg rounded-3xl!"
            >
              Continue with Hack Club Auth
          </button>

          <button
            onClick={handleGoogleAuth}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] mx-[10dvw] backdrop-blur-lg rounded-3xl!"
          >
            Continue with Google
        </button>

        <button
          onClick={handleGitHubAuth}
          className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] mx-[10dvw] backdrop-blur-lg rounded-3xl!"
        >
          Continue with GitHub
        </button>
        </div>
      </div>
    </div>
  );
}