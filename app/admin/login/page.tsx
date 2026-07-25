"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CookieIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { fadeInUp } from "@/presentation/lib/animations";
import { loginAdmin } from "../actions";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = React.useState("admin@crumbleivable.com");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAdmin(email, password);

      if (result.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2C1810] p-4">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4538A]">
              <CookieIcon className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h1 className="font-display text-3xl text-white">crumbleivable!</h1>
          <p className="mt-2 text-white/70">Admin Dashboard</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_32px_rgba(44,24,16,0.16)] sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-[#2C1810]">Sign In</h2>

          {error && (
            <div data-testid="login-error" className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2 cursor-pointer"
              data-testid="login-button"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#A07850]">
            Default: admin@crumbleivable.com / admin123
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          © {new Date().getFullYear()} Crumbleivable!
        </p>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#2C1810]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
