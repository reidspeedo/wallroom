'use client';

import { Calendar } from 'lucide-react';

interface ControlBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function ControlBar({
  selectedDate,
  onDateChange
}: ControlBarProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isToday && (
              <span className="text-sm text-slate-600">Today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

