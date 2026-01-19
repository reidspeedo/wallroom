export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
        <span className="text-white font-bold text-lg">W</span>
      </div>
      <span className="font-bold text-xl text-slate-900 tracking-tight">wallBoard</span>
    </div>
  );
}

