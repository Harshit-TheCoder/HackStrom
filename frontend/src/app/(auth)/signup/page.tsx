"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      
      setSuccess("Account activated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
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
        <h2 className="text-3xl font-light text-white mb-2 text-center">New Operative</h2>
        <p className="text-neutral-400 text-center mb-8 text-sm">Register your identity in the secure ledger</p>

        {error && <div className="mb-4 text-red-400 border border-red-500/30 bg-red-500/10 p-3 rounded-lg text-sm text-center">{error}</div>}
        {success && <div className="mb-4 text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 p-3 rounded-lg text-sm text-center">{success}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full Name / Callsign"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Secure Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Encrypted Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-cyan-900/20 transition-all border border-cyan-500/30"
          >
            Encrypt & Register Identity
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          Already a certified operative?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Return to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
