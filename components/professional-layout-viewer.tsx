'use client';

import { ProfessionalRoomCard } from './professional-room-card';

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

interface ProfessionalLayoutViewerProps {
  rooms: Room[];
  canvasWidth: number;
  canvasHeight: number;
  onRoomClick?: (roomId: string) => void;
}

export function ProfessionalLayoutViewer({
  rooms,
  canvasWidth,
  canvasHeight,
  onRoomClick
}: ProfessionalLayoutViewerProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
      style={{ 
        height: `${canvasHeight}px`
      }}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Rooms */}
      {rooms.map((room) => {
        if (room.layoutX === undefined || room.layoutY === undefined || 
            room.layoutW === undefined || room.layoutH === undefined) {
          return null;
        }

        return (
          <ProfessionalRoomCard
            key={room.id}
            room={room}
            onClick={() => onRoomClick?.(room.id)}
          />
        );
      })}
    </div>
  );
}

