import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background radial gradient for dynamic lighting effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_800px_at_50%_-30%,#312e81_0%,transparent_100%)] opacity-50 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Nexus AI Control Tower
            </h1>
            <p className="text-slate-400">Gemini-Powered Supply Chain Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400">System Online</span>
          </div>
        </header>

        <Dashboard />
      </div>
    </main>
  );
}
