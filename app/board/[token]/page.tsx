'use client';

import { useEffect, useState, use, useRef } from 'react';
import { ControlBar } from '@/components/control-bar';
import { ProfessionalLayoutViewer } from '@/components/professional-layout-viewer';
import { SlideOverPanel } from '@/components/slide-over-panel';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  canExtend?: boolean;
  canEndEarly?: boolean;
}

interface Room {
  id: string;
  name: string;
  color: string | null;
  capacity: number | null;
  isActive: boolean;
  status: 'free' | 'occupied';
  currentBooking?: Booking;
  nextBooking?: Booking;
  dayBookings?: Booking[];
  features?: string[];
  layoutX?: number;
  layoutY?: number;
  layoutW?: number;
  layoutH?: number;
}

interface BoardState {
  serverTime: string;
  rooms: Room[];
  bookingDurations: number[];
  extendIncrements: number[];
}

export default function BoardPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // View state
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Panel state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 675 }); // 16:9 aspect ratio
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadBoardState();
    const pollInterval = 10 * 1000;
    const interval = setInterval(loadBoardState, pollInterval);
    return () => clearInterval(interval);
  }, [token, selectedDate]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (layoutContainerRef.current) {
        const rect = layoutContainerRef.current.getBoundingClientRect();
        // Maintain 16:9 aspect ratio
        const height = (rect.width * 9) / 16;
        setCanvasSize({
          width: rect.width,
          height: Math.max(400, Math.min(800, height))
        });
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const loadBoardState = async () => {
    try {
      // Format date as YYYY-MM-DD for API
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/board/${token}/state?date=${dateStr}`);
      if (!response.ok) {
        throw new Error('Failed to load board state');
      }
      const data = await response.json();
      setBoardState(data);
      setError('');
    } catch (err) {
      setError('Failed to load board. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setPanelOpen(true);
  };

  const handleQuickBook = async (roomId: string, duration: number) => {
    const room = boardState?.rooms.find(r => r.id === roomId);
    if (!room) return;

    const now = new Date();
    const startTime = new Date(now);
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0);

    await handleBook(roomId, duration, startTime.toISOString(), 'Quick Booking');
  };

  const handleBook = async (
    roomId: string,
    duration: number,
    startTime: string,
    title: string
  ) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/board/${token}/rooms/${roomId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes: duration,
          startTime,
          title: title.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Booking failed');
      }

      setPanelOpen(false);
      setSelectedRoom(null);
      await loadBoardState();
    } catch (err) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async (bookingId: string, increment: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/board/${token}/bookings/${bookingId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incrementMinutes: increment })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extend booking');
      }

      await loadBoardState();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to extend booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndEarly = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/board/${token}/bookings/${bookingId}/end`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to end booking');
      }

      await loadBoardState();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to end booking');
    } finally {
      setActionLoading(false);
    }
  };

  // All rooms are shown (no filtering)
  const filteredRooms = boardState?.rooms || [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-900">Loading meeting rooms...</p>
          <p className="mt-2 text-sm text-slate-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (error && !boardState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-900">Error</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={loadBoardState}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">Meeting Rooms</h1>
          <p className="mt-1 text-sm text-slate-600">
            {boardState && `Last updated ${new Date(boardState.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      {boardState && (
        <ControlBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {error}
          </div>
        )}

        {/* Floorplan View */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            ref={layoutContainerRef}
            className="w-full overflow-hidden rounded-lg bg-slate-50 p-6"
          >
            {boardState && (
              <ProfessionalLayoutViewer
                rooms={filteredRooms.map((room) => ({
                  ...room,
                  currentBooking: room.currentBooking ? {
                    title: room.currentBooking.title,
                    endTime: room.currentBooking.endTime
                  } : undefined,
                  nextBooking: room.nextBooking ? {
                    title: room.nextBooking.title,
                    startTime: room.nextBooking.startTime
                  } : undefined
                }))}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                onRoomClick={(roomId) => {
                  const room = boardState.rooms.find((r) => r.id === roomId);
                  if (room) handleRoomClick(room);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Slide-Over Panel */}
      {boardState && selectedRoom && (
        <SlideOverPanel
          room={selectedRoom}
          isOpen={panelOpen}
          onClose={() => {
            setPanelOpen(false);
            setSelectedRoom(null);
          }}
          bookingDurations={boardState.bookingDurations}
          onBook={handleBook}
          onExtend={handleExtend}
          onEndEarly={handleEndEarly}
          extendIncrements={boardState.extendIncrements}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
