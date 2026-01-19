'use client';

import { Settings } from 'lucide-react';
import { Logo } from './logo';
import { useState } from 'react';
import { SettingsPanel } from './settings-panel';

interface AppHeaderProps {
  showSettings?: boolean;
  subtitle?: string;
}

export function AppHeader({ showSettings = true, subtitle }: AppHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  return (
    <>
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo />
              {subtitle && (
                <p className="text-sm font-medium text-slate-500 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
            {showSettings && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      {showSettings && (
        <SettingsPanel 
          open={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
        />
      )}
    </>
  );
}

