"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const role = data.user.app_metadata?.role;
    const clientSlug = data.user.app_metadata?.clientSlug;

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "client" && clientSlug) {
      router.push(`/dashboard/${clientSlug}`);
    } else {
      setError("Account not configured. Contact your administrator.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-navy-charcoal min-h-screen flex flex-col antialiased">
      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="glass-card w-full max-w-md rounded-xl p-8 md:p-10 flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <svg
              width="32"
              height="20"
              viewBox="0 0 200 60"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="BrandQure logo"
            >
              <path
                d="M20 15C20 12.2386 22.2386 10 25 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H25C22.2386 50 20 47.7614 20 45V15Z"
                fill="white"
                fillOpacity="0.9"
              />
              <path
                d="M30 25L35 35L40 25"
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="font-label-md text-label-md text-white/70 tracking-widest uppercase">
              BrandQure
            </span>
          </div>

          <h1 className="font-headline-lg text-headline-lg text-white text-center mb-1">
            Secure Login
          </h1>
          <p className="font-body-md text-body-md text-white/50 text-center mb-8">
            BrandQure Inventory Command Center
          </p>

          <form onSubmit={handleSignIn} className="w-full space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block font-label-md text-label-md text-white/80 mb-2"
              >
                Work Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[20px] pointer-events-none">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="executive@brandqure.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg font-body-md text-body-md text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block font-label-md text-label-md text-white/80 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg font-body-md text-body-md text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-secondary-container focus:ring-secondary-container"
                />
                <span className="font-label-md text-label-md text-white/60">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="font-label-md text-label-md text-secondary-container hover:text-secondary-container/80 transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Error message */}
            {error && (
              <p className="font-label-md text-label-md text-red-400 text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-label-md text-label-md text-white bg-white/15 border border-white/30 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {loading ? "progress_activity" : "login"}
              </span>
              {loading ? "Signing in…" : "Sign In to Command Center"}
            </button>
          </form>

          {/* Register prompt */}
          <p className="mt-6 font-label-md text-label-md text-white/50 text-center">
            Need organizational access?{" "}
            <a
              href="#"
              className="text-secondary-container hover:text-secondary-container/80 transition-colors"
            >
              Request Access
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-4 md:px-8 max-w-[1440px] mx-auto">
          <p className="font-label-md text-label-md text-white/40">
            Powered by BrandQure © 2026
          </p>
          <div className="flex gap-4">
            {["Privacy Policy", "Support", "Terms of Service"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-label-sm text-label-sm text-white/40 hover:text-white/70 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
