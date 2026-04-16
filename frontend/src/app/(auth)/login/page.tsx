"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaPending, setMfaPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/oauth/google`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "token": credentialResponse.credential 
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Google authentication failed");
      
      setToken(data.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      if (data.mfa_pending) {
        setMfaPending(true);
      } else {
        setToken(data.access_token);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/verify-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");
      
      setToken(data.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/90 p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute w-[500px] h-[500px] bg-cyan-900/30 blur-[120px] rounded-full top-[-100px] left-[-100px] pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-indigo-900/30 blur-[120px] rounded-full bottom-[-100px] right-[-100px] pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-neutral-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 z-10 shadow-2xl"
      >
        <h2 className="text-3xl font-light text-white mb-2 text-center">
            {mfaPending ? "Verify Identity" : "Access Console"}
        </h2>
        <p className="text-neutral-400 text-center mb-8 text-sm">
            {mfaPending ? "A secure code has been sent to your device." : "Enter your credentials to connect"}
        </p>

        {error && <div className="mb-4 text-red-400 border border-red-500/30 bg-red-500/10 p-3 rounded-lg text-sm text-center">{error}</div>}

        {!mfaPending ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-cyan-900/20 transition-all border border-cyan-500/30"
            >
              Initialize Connection
            </button>
            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>
            
            <div className="flex justify-center">
                <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google Login Failed")}
                    theme="filled_black"
                    shape="pill"
                    width="100%"
                />
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Authentication OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[0.5em] font-mono bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-cyan-400 placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all border border-emerald-500/30"
            >
              Verify & Complete Authentication
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-neutral-500">
          Not authorized yet?{" "}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Request Access
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
