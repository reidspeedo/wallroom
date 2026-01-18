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
  currentBooking?: {
    title: string;
    endTime: string;
  };
  nextBooking?: {
    title: string;
    startTime: string;
  };
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
      {/* Grid background */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`h-${i}`} className="absolute border-t border-dashed border-gray-300" style={{ top: `${(i * 10)}%`, width: '100%', height: '1px' }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`v-${i}`} className="absolute border-l border-dashed border-gray-300" style={{ left: `${(i * 10)}%`, width: '1px', height: '100%' }} />
        ))}
      </div>

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
            <div className="flex h-full flex-col items-center justify-center p-2 text-center text-white">
              <span className="font-bold" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.7}px` }}>
                {room.name}
              </span>
              <span className="mt-1 text-xs font-semibold" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.4}px` }}>
                {isFree ? 'Available' : 'Occupied'}
              </span>
              {room.currentBooking && (
                <div className="mt-1 text-xs" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.35}px` }}>
                  <div className="truncate">{room.currentBooking.title}</div>
                  <div>Until {new Date(room.currentBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )}
              {!room.currentBooking && room.nextBooking && (
                <div className="mt-1 text-xs" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.35}px` }}>
                  <div>Next: {new Date(room.nextBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
