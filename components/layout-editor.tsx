'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface Room {
  id: string;
  name: string;
  color: string | null;
  layoutX: number;
  layoutY: number;
  layoutW: number;
  layoutH: number;
}

interface LayoutEditorProps {
  rooms: Room[];
  canvasWidth: number;
  canvasHeight: number;
  onRoomUpdate: (roomId: string, updates: Partial<Pick<Room, 'layoutX' | 'layoutY' | 'layoutW' | 'layoutH'>>) => void;
  onRoomSelect?: (roomId: string | null) => void;
  selectedRoomId?: string | null;
  backgroundImageUrl?: string;
}

export function LayoutEditor({
  rooms,
  canvasWidth,
  canvasHeight,
  onRoomUpdate,
  onRoomSelect,
  selectedRoomId,
  backgroundImageUrl
}: LayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ roomId: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [resizing, setResizing] = useState<{ roomId: string; handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; initialW: number; initialH: number; initialX: number; initialY: number } | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const handleMouseDown = useCallback((e: React.MouseEvent, roomId: string, type: 'drag' | 'resize', handle?: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (type === 'drag') {
      setDragging({
        roomId,
        startX: x,
        startY: y,
        initialX: room.layoutX,
        initialY: room.layoutY
      });
      onRoomSelect?.(roomId);
    } else if (type === 'resize' && handle) {
      setResizing({
        roomId,
        handle,
        startX: x,
        startY: y,
        initialW: room.layoutW,
        initialH: room.layoutH,
        initialX: room.layoutX,
        initialY: room.layoutY
      });
      onRoomSelect?.(roomId);
    }
  }, [rooms, onRoomSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragging) {
      const deltaX = x - dragging.startX;
      const deltaY = y - dragging.startY;
      const room = rooms.find((r) => r.id === dragging.roomId);
      if (!room) return;

      const newX = clamp(dragging.initialX + deltaX, 0, 100 - room.layoutW);
      const newY = clamp(dragging.initialY + deltaY, 0, 100 - room.layoutH);

      onRoomUpdate(dragging.roomId, {
        layoutX: Math.round(newX),
        layoutY: Math.round(newY)
      });
    } else if (resizing) {
      const deltaX = x - resizing.startX;
      const deltaY = y - resizing.startY;
      const room = rooms.find((r) => r.id === resizing.roomId);
      if (!room) return;

      let newW = resizing.initialW;
      let newH = resizing.initialH;
      let newX = resizing.initialX;
      let newY = resizing.initialY;

      if (resizing.handle === 'se') {
        newW = clamp(resizing.initialW + deltaX, 5, 100 - resizing.initialX);
        newH = clamp(resizing.initialH + deltaY, 5, 100 - resizing.initialY);
      } else if (resizing.handle === 'sw') {
        newW = clamp(resizing.initialW - deltaX, 5, resizing.initialX + resizing.initialW);
        newH = clamp(resizing.initialH + deltaY, 5, 100 - resizing.initialY);
        newX = clamp(resizing.initialX + deltaX, 0, resizing.initialX + resizing.initialW - 5);
      } else if (resizing.handle === 'ne') {
        newW = clamp(resizing.initialW + deltaX, 5, 100 - resizing.initialX);
        newH = clamp(resizing.initialH - deltaY, 5, resizing.initialY + resizing.initialH);
        newY = clamp(resizing.initialY + deltaY, 0, resizing.initialY + resizing.initialH - 5);
      } else if (resizing.handle === 'nw') {
        newW = clamp(resizing.initialW - deltaX, 5, resizing.initialX + resizing.initialW);
        newH = clamp(resizing.initialH - deltaY, 5, resizing.initialY + resizing.initialH);
        newX = clamp(resizing.initialX + deltaX, 0, resizing.initialX + resizing.initialW - 5);
        newY = clamp(resizing.initialY + deltaY, 0, resizing.initialY + resizing.initialH - 5);
      }

      onRoomUpdate(resizing.roomId, {
        layoutX: Math.round(newX),
        layoutY: Math.round(newY),
        layoutW: Math.round(newW),
        layoutH: Math.round(newH)
      });
    }
  }, [dragging, resizing, rooms, onRoomUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50"
      style={{ height: `${canvasHeight}px` }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onRoomSelect?.(null);
        }
      }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`h-${i}`} className="absolute border-t border-dashed border-gray-300" style={{ top: `${(i * 10)}%`, width: '100%', height: '1px' }} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`v-${i}`} className="absolute border-l border-dashed border-gray-300" style={{ left: `${(i * 10)}%`, width: '1px', height: '100%' }} />
        ))}
      </div>

      {/* Rooms */}
      {rooms.map((room) => {
        const isSelected = selectedRoomId === room.id;
        return (
          <div
            key={room.id}
            className={`absolute cursor-move rounded-xl border-2 transition-all ${
              isSelected ? 'shadow-elevated ring-2 ring-blue-500 ring-offset-2' : 'shadow-soft hover:shadow-elevated'
            }`}
            style={{
              left: `${room.layoutX}%`,
              top: `${room.layoutY}%`,
              width: `${room.layoutW}%`,
              height: `${room.layoutH}%`,
              backgroundColor: room.color || '#8ea2c2',
              borderColor: isSelected ? '#2563eb' : '#ffffff'
            }}
            onMouseDown={(e) => handleMouseDown(e, room.id, 'drag')}
            onClick={(e) => {
              e.stopPropagation();
              onRoomSelect?.(room.id);
            }}
          >
            <div className="flex h-full items-center justify-center text-center text-white">
              <span className="font-bold" style={{ fontSize: `${Math.min(room.layoutW, room.layoutH) * 0.8}px` }}>
                {room.name}
              </span>
            </div>

            {/* Resize handles */}
            {isSelected && (
              <>
                <div
                  className="absolute -left-1 -top-1 h-3 w-3 cursor-nwse-resize rounded-full bg-blue-500"
                  style={{ zIndex: 10 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, room.id, 'resize', 'nw');
                  }}
                />
                <div
                  className="absolute -right-1 -top-1 h-3 w-3 cursor-nesw-resize rounded-full bg-blue-500"
                  style={{ zIndex: 10 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, room.id, 'resize', 'ne');
                  }}
                />
                <div
                  className="absolute -left-1 -bottom-1 h-3 w-3 cursor-nesw-resize rounded-full bg-blue-500"
                  style={{ zIndex: 10 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, room.id, 'resize', 'sw');
                  }}
                />
                <div
                  className="absolute -right-1 -bottom-1 h-3 w-3 cursor-nwse-resize rounded-full bg-blue-500"
                  style={{ zIndex: 10 }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, room.id, 'resize', 'se');
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
