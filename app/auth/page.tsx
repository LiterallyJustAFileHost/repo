"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SiGoogle, SiGithub, SiHackclub } from "@icons-pack/react-simple-icons";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);

  const handleHackClubAuth = async () => {
    setLoading("hackclub");
    setError(null);
    setMessage(null);

    await authClient.signIn.social({
      provider: "hackclub",
      callbackURL: "/dashboard",
    });
  };

  const handleGoogleAuth = async () => {
    setLoading("google");
    setError(null);
    setMessage(null);

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleGitHubAuth = async () => {
    setLoading("github");
    setError(null);
    setMessage(null);

    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  };

  const handleSignUp = async () => {
    setLoading("signup");
    setError(null);
    setMessage(null);

    const result = await authClient.signUp.email({
      name: email.split("@")[0],
      email,
      password,
      callbackURL: "/dashboard",
    });

    setLoading(null);

    if (result.error) {
      setError(
        result.error.message ||
          "Something went wrong while creating your account."
      );
      return;
    }

    setCanResend(true);
    setMessage(
      "Account created! Check your email and click the verification link."
    );
  };

  const handleSignIn = async () => {
    setLoading("signin");
    setError(null);
    setMessage(null);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    setLoading(null);

    if (result.error) {
      setError(result.error.message || "Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleResend = async () => {
    setLoading("resend");

    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      console.warn("Email resend failed", err);
      setError("Couldn't resend the email. Try again shortly.");
    }

    setLoading(null);
  };

  return (
    <div className="flex h-dvh">
      <div className="h-[90dvh] w-full flex flex-row mx-[8dvw] my-auto bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-2xl">
        <div className="flex flex-col gap-3 w-fit h-full p-[3dvw] pr-[9dvw] border-r-4 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold">LOGIN</h1>
            <p className="whitespace-nowrap">Access the best file hoster!</p>
          </div>
          <p className="mt-auto whitespace-nowrap">
            Created by the<br />
            <Link href="/team" className="underline underline-offset-4 decoration-(--highlight) decoration-2"><span className="text-accent font-semibold">LiterallyJustAFileHost</span> Team</Link>
          </p>
        </div>

        <div className="flex flex-col gap-4 justify-center w-full p-[3dvw] mx-[10%]">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading !== null}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl px-6 py-3 outline-none disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading !== null}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl px-6 py-3 outline-none disabled:opacity-50"
          />

          {error && (
            <p className="text-red-400 text-center">
              {error}
            </p>
          )}

          {message && (
            <p className="text-center">
              {message}
            </p>
          )}

          {canResend && (
            <button
              onClick={handleResend}
              disabled={loading !== null}
              className="text-sm opacity-70 hover:opacity-100 underline disabled:opacity-40"
            >
              {loading === "resend" ? "Sending..." : "Resend verification email"}
            </button>
          )}

          <div className="flex gap-4">
            <motion.button
              initial={{ flexGrow: 2 }}
              whileHover={{ flexGrow: 3 }}
              transition={{ duration: 0.2 }}
              onClick={handleSignUp}
              disabled={loading !== null || !email || !password}
              className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl! disabled:opacity-50"
            >
              {loading === "signup" ? "Creating account..." : "Sign up"}
            </motion.button>

            <motion.button
              initial={{ flexGrow: 1 }}
              whileHover={{ flexGrow: 3 }}
              transition={{ duration: 0.3 }}
              onClick={handleSignIn}
              disabled={loading !== null || !email || !password}
              className="grow bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl! disabled:opacity-50"
            >
              {loading === "signin" ? "Signing in..." : "Sign in"}
            </motion.button>
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px grow bg-[rgba(255,255,255,0.12)]" />
            <p className="text-sm opacity-50">OR</p>
            <div className="h-px grow bg-[rgba(255,255,255,0.12)]" />
          </div>

          <motion.button
            initial={{ backgroundColor: "rgba(255,255,255,0.07)" }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            transition={{ duration: 0.1 }}
            onClick={handleGoogleAuth}
            disabled={loading !== null}
            className="border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl! disabled:opacity-50 flex flex-row gap-3 items-center justify-center"
          >
            <SiGoogle size={20}/>
            {loading === "google"
              ? "Redirecting..."
              : "Continue with Google"}
          </motion.button>

          <motion.button
            initial={{ backgroundColor: "rgba(255,255,255,0.07)" }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            transition={{ duration: 0.1 }}
            onClick={handleGitHubAuth}
            disabled={loading !== null}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl! disabled:opacity-50 flex flex-row gap-3 items-center justify-center"
          >
            <SiGithub size={20}/>
            {loading === "github"
              ? "Redirecting..."
              : "Continue with GitHub"}
          </motion.button>

          <motion.button
            initial={{ backgroundColor: "rgba(255,255,255,0.07)" }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            transition={{ duration: 0.1 }}
            onClick={handleHackClubAuth}
            disabled={loading !== null}
            className="bg-[rgba(255,255,255,0.07)] border-4 border-[rgba(255,255,255,0.12)] backdrop-blur-lg rounded-3xl! disabled:opacity-50 flex flex-row gap-3 items-center justify-center"
          >
            <SiHackclub/>
            {loading === "hackclub"
              ? "Redirecting..."
              : "Continue with Hack Club Auth (Edu.)"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
