'use client';

import { Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Room {
  id: string;
  name: string;
  color: string | null;
  capacity: number | null;
  isActive: boolean;
  status: 'free' | 'occupied';
  currentBooking?: {
    title: string;
    endTime: string;
  };
  nextBooking?: {
    title: string;
    startTime: string;
  };
  dayBookings?: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

interface RoomListViewProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
  bookingDurations: number[];
  onQuickBook?: (roomId: string, duration: number) => void;
}

export function RoomListView({ 
  rooms, 
  onRoomClick,
  bookingDurations,
  onQuickBook
}: RoomListViewProps) {
  const getStatusInfo = (room: Room) => {
    if (room.status === 'free') {
      if (room.nextBooking) {
        const nextTime = new Date(room.nextBooking.startTime);
        const now = new Date();
        const minutesUntil = Math.floor((nextTime.getTime() - now.getTime()) / 60000);
        
        if (minutesUntil <= 15) {
          return {
            label: 'Ending soon',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            timeText: `Free until ${nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          };
        }
        
        return {
          label: 'Available',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          timeText: `Free until ${nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
      }
      return {
        label: 'Available now',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        timeText: 'Available now'
      };
    } else {
      const endTime = new Date(room.currentBooking!.endTime);
      const now = new Date();
      const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / 60000);
      
      return {
        label: 'In use',
        color: 'bg-red-100 text-red-800 border-red-200',
        timeText: minutesRemaining > 0 
          ? `Ends in ${minutesRemaining} min`
          : 'Ending now',
        bookingTitle: room.currentBooking?.title
      };
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Room
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Capacity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Available Until
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Features
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rooms.map((room) => {
            const statusInfo = getStatusInfo(room);
            const isFree = room.status === 'free';

            return (
              <tr
                key={room.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onRoomClick(room)}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{room.name}</div>
                  {!isFree && statusInfo.bookingTitle && (
                    <div className="text-sm text-slate-600 mt-0.5">
                      {statusInfo.bookingTitle}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {room.capacity ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>{room.capacity}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>{statusInfo.timeText}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Zoom</span>
                    <span>•</span>
                    <span>TV</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {isFree && onQuickBook && bookingDurations.slice(0, 2).map((duration) => (
                      <Button
                        key={duration}
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickBook(room.id, duration)}
                        className="h-7 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        {duration}m
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRoomClick(room)}
                      className="h-7 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

