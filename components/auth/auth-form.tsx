"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuthMode = "join" | "signin";

export function AuthForm({ initialMode = "join" }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "join") {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Registration failed");
          setLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Account created. Please sign in.");
          setMode("signin");
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Network error");
        setLoading(false);
      }
    } else {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    }
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError("");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Siht<span className="text-accent">Agent</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your AI-powered job hunter
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-surface-border bg-surface p-8">
          {/* Tab Switcher */}
          <div className="mb-8 flex rounded-xl bg-surface-light p-1">
            <button
              type="button"
              onClick={() => switchMode("join")}
              className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all cursor-pointer ${
                mode === "join"
                  ? "bg-accent text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-accent text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign in
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "join" && (
              <Input
                id="name"
                placeholder="Your name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <Input
              id="email"
              placeholder="Email address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              placeholder="Password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "join" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading
                ? "Please wait..."
                : "Continue"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          By continuing, you agree to SihtAgent&apos;s Terms of Service and
          Privacy Policy.
        </p>
      </div>
    </div>
  );
}
