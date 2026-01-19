export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>© {new Date().getFullYear()} wallBoard</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

