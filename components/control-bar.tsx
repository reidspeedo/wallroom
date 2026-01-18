'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface ControlBarProps {
  viewMode: 'floorplan' | 'list';
  onViewModeChange: (mode: 'floorplan' | 'list') => void;
  showAvailableOnly: boolean;
  onShowAvailableOnlyChange: (value: boolean) => void;
  minCapacity?: number;
  onMinCapacityChange?: (value: number) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  timeRange: 'now' | 'next30' | 'custom';
  onTimeRangeChange: (range: 'now' | 'next30' | 'custom') => void;
}

export function ControlBar({
  viewMode,
  onViewModeChange,
  showAvailableOnly,
  onShowAvailableOnlyChange,
  minCapacity,
  onMinCapacityChange,
  selectedDate,
  onDateChange,
  timeRange,
  onTimeRangeChange
}: ControlBarProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
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

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeRangeChange('now')}
            className={`h-7 px-3 text-xs ${
              timeRange === 'now'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeRangeChange('next30')}
            className={`h-7 px-3 text-xs ${
              timeRange === 'next30'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Next 30
          </Button>
        </div>

        {/* Capacity Filter */}
        {onMinCapacityChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Min capacity:</label>
            <Input
              type="number"
              min={1}
              value={minCapacity || ''}
              onChange={(e) => onMinCapacityChange(Number(e.target.value) || 0)}
              placeholder="Any"
              className="h-8 w-20 border-slate-300 text-sm"
            />
          </div>
        )}

        {/* Available Only Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="available-only"
            checked={showAvailableOnly}
            onChange={(e) => onShowAvailableOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="available-only" className="text-sm font-medium text-slate-700 cursor-pointer">
            Available only
          </label>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('floorplan')}
            className={`h-7 px-3 text-xs ${
              viewMode === 'floorplan'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Floorplan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`h-7 px-3 text-xs ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List
          </Button>
        </div>
      </div>
    </div>
  );
}

