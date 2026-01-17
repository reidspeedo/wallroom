'use client';

interface Room {
  id: string;
  name: string;
  color: string | null;
  layoutX?: number;
  layoutY?: number;
  layoutW?: number;
  layoutH?: number;
  status: 'free' | 'occupied';
}

interface LayoutViewerProps {
  rooms: Room[];
  canvasWidth: number;
  canvasHeight: number;
  onRoomClick?: (roomId: string) => void;
  backgroundImageUrl?: string;
}

export function LayoutViewer({
  rooms,
  canvasWidth,
  canvasHeight,
  onRoomClick,
  backgroundImageUrl
}: LayoutViewerProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border bg-white"
      style={{ height: `${canvasHeight}px` }}
    >
      {/* Rooms */}
      {rooms.map((room) => {
        if (room.layoutX === undefined || room.layoutY === undefined || 
            room.layoutW === undefined || room.layoutH === undefined) {
          return null;
        }

        const isFree = room.status === 'free';
        return (
          <div
            key={room.id}
            className={`absolute cursor-pointer rounded border-2 shadow-md transition-opacity hover:opacity-90 ${
              isFree ? 'border-green-400' : 'border-red-400'
            }`}
            style={{
              left: `${room.layoutX}%`,
              top: `${room.layoutY}%`,
              width: `${room.layoutW}%`,
              height: `${room.layoutH}%`,
              backgroundColor: room.color || '#3b82f6',
              opacity: isFree ? 0.9 : 0.8
            }}
            onClick={() => onRoomClick?.(room.id)}
          >
            <div className="flex h-full flex-col items-center justify-center text-center text-white">
              <span className="font-bold" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.8}px` }}>
                {room.name}
              </span>
              <span className="mt-1 text-xs" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.5}px` }}>
                {isFree ? 'Available' : 'Occupied'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
