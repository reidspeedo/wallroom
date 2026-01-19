'use client';

import { Users, Clock } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  capacity: number | null;
  status: 'free' | 'occupied';
  currentBooking?: {
    title: string;
    endTime: string;
  };
  nextBooking?: {
    title: string;
    startTime: string;
  };
  layoutX?: number;
  layoutY?: number;
  layoutW?: number;
  layoutH?: number;
}

interface ProfessionalRoomCardProps {
  room: Room;
  onClick: () => void;
}

export function ProfessionalRoomCard({ room, onClick }: ProfessionalRoomCardProps) {
  const getStatusInfo = () => {
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
        timeText: ''
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
          : 'Ending now'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const isFree = room.status === 'free';

  return (
    <div
      className="absolute cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300"
      style={{
        left: `${room.layoutX}%`,
        top: `${room.layoutY}%`,
        width: `${room.layoutW}%`,
        height: `${room.layoutH}%`,
      }}
      onClick={onClick}
    >
      <div className="flex h-full flex-col p-3 min-w-0">
        {/* Header: Room name and status */}
        <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate flex-1 min-w-0">
            {room.name}
          </h3>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Metadata */}
        <div className="mt-auto space-y-1">
          {/* Capacity */}
          {room.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="h-3 w-3" />
              <span>{room.capacity} {room.capacity === 1 ? 'seat' : 'seats'}</span>
            </div>
          )}

          {/* Time info */}
          {statusInfo.timeText && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{statusInfo.timeText}</span>
            </div>
          )}

          {/* Current booking title if occupied */}
          {!isFree && room.currentBooking && (
            <div className="text-xs text-slate-600 truncate mt-1">
              {room.currentBooking.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

