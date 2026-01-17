'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

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
  isActive: boolean;
  status: 'free' | 'occupied';
  currentBooking?: Booking;
  nextBooking?: Booking;
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

  // Booking modal state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingTitle, setBookingTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Room detail modal state
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBoardState();

    // Set up polling (default 10 seconds)
    const pollInterval = 10 * 1000;
    const interval = setInterval(loadBoardState, pollInterval);

    return () => clearInterval(interval);
  }, [token]);

  const loadBoardState = async () => {
    try {
      const response = await fetch(`/api/board/${token}/state`);
      
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
    if (room.status === 'free') {
      setSelectedRoom(room);
      setBookingTitle('');
      setSelectedDuration(null);
      setBookingError('');
    } else {
      setDetailRoom(room);
    }
  };

  const handleBook = async () => {
    if (!selectedRoom || !selectedDuration || !bookingTitle.trim()) {
      setBookingError('Please fill in all fields');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(
        `/api/board/${token}/rooms/${selectedRoom.id}/book`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationMinutes: selectedDuration,
            title: bookingTitle.trim()
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Booking failed');
      }

      setSelectedRoom(null);
      await loadBoardState();
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : 'Failed to create booking'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleEndBooking = async (bookingId: string) => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `/api/board/${token}/bookings/${bookingId}/end`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to end booking');
      }

      setDetailRoom(null);
      await loadBoardState();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to end booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendBooking = async (
    bookingId: string,
    incrementMinutes: number
  ) => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `/api/board/${token}/bookings/${bookingId}/extend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incrementMinutes })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extend booking');
      }

      setDetailRoom(null);
      await loadBoardState();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to extend booking');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins <= 0) return 'Ending soon';
    if (diffMins < 60) return `${diffMins} min left`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m left`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-xl">Loading board...</p>
      </div>
    );
  }

  if (error && !boardState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadBoardState}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Meeting Rooms</h1>
          <p className="text-muted-foreground">
            Tap a room to book or view details
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boardState?.rooms.map((room) => (
            <Card
              key={room.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                room.status === 'free'
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              }`}
              onClick={() => handleRoomClick(room)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg"
                    style={{ backgroundColor: room.color || '#3b82f6' }}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{room.name}</CardTitle>
                    <div
                      className={`mt-1 text-lg font-semibold ${
                        room.status === 'free'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {room.status === 'free' ? 'Available' : 'Occupied'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {room.currentBooking && (
                  <div className="space-y-1">
                    <p className="font-medium">{room.currentBooking.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Until {formatTime(room.currentBooking.endTime)}
                    </p>
                    <p className="text-sm font-medium text-red-600">
                      {getTimeRemaining(room.currentBooking.endTime)}
                    </p>
                  </div>
                )}
                {!room.currentBooking && room.nextBooking && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Next booking:</p>
                    <p className="font-medium">{room.nextBooking.title}</p>
                    <p className="text-sm text-muted-foreground">
                      At {formatTime(room.nextBooking.startTime)}
                    </p>
                  </div>
                )}
                {!room.currentBooking && !room.nextBooking && (
                  <p className="text-sm text-muted-foreground">
                    Free all day
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking Modal */}
        <Dialog
          open={!!selectedRoom}
          onOpenChange={(open) => !open && setSelectedRoom(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
              <DialogDescription>
                Select a duration and enter a meeting title
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Duration</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {boardState?.bookingDurations.map((duration) => (
                    <Button
                      key={duration}
                      variant={
                        selectedDuration === duration ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedDuration(duration)}
                      type="button"
                    >
                      {duration} min
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="title" className="text-sm font-medium">
                  Meeting Title
                </label>
                <Input
                  id="title"
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  placeholder="e.g., Team Standup"
                  maxLength={120}
                  className="mt-1"
                />
              </div>
              {bookingError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {bookingError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRoom(null)}
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleBook} disabled={bookingLoading}>
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Room Detail Modal */}
        <Dialog
          open={!!detailRoom}
          onOpenChange={(open) => !open && setDetailRoom(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{detailRoom?.name}</DialogTitle>
              <DialogDescription>Current booking details</DialogDescription>
            </DialogHeader>
            {detailRoom?.currentBooking && (
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Meeting</p>
                  <p className="text-lg font-medium">
                    {detailRoom.currentBooking.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatTime(detailRoom.currentBooking.startTime)} -{' '}
                    {formatTime(detailRoom.currentBooking.endTime)}
                  </p>
                  <p className="text-sm text-red-600">
                    {getTimeRemaining(detailRoom.currentBooking.endTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {detailRoom.currentBooking.canEndEarly && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleEndBooking(detailRoom.currentBooking!.id)
                      }
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      End Now
                    </Button>
                  )}
                  {detailRoom.currentBooking.canExtend && (
                    <div className="flex flex-1 gap-2">
                      {boardState?.extendIncrements.map((increment) => (
                        <Button
                          key={increment}
                          variant="outline"
                          onClick={() =>
                            handleExtendBooking(
                              detailRoom.currentBooking!.id,
                              increment
                            )
                          }
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          +{increment}m
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailRoom(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
