'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface Room {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
  capacity?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  timeZone: string | null;
  pollIntervalSeconds: number;
  bookingDurations: number[];
  extendIncrements: number[];
  boardPublicUrl: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Room form state
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomColor, setNewRoomColor] = useState('#3b82f6');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/rooms'),
        fetch('/api/admin/settings')
      ]);

      if (!roomsRes.ok || !settingsRes.ok) {
        if (roomsRes.status === 401 || settingsRes.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to load data');
      }

      const roomsData = await roomsRes.json();
      const settingsData = await settingsRes.json();

      setRooms(roomsData.rooms);
      setSettings(settingsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          color: newRoomColor,
          description: newRoomDescription || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add room');
      }

      setNewRoomName('');
      setNewRoomColor('#3b82f6');
      setNewRoomDescription('');
      setIsAddingRoom(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add room');
    }
  };

  const handleToggleActive = async (roomId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update room');
      }

      await loadData();
    } catch (err) {
      setError('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      await loadData();
    } catch (err) {
      setError('Failed to delete room');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">WallBoard Rooms Admin</h1>
            <p className="text-muted-foreground">
              Manage your meeting rooms and settings
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Board URL Card */}
        <Card>
          <CardHeader>
            <CardTitle>Public Board URL</CardTitle>
            <CardDescription>
              Share this URL to access the public booking board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={settings?.boardPublicUrl || ''}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() =>
                  settings?.boardPublicUrl &&
                  navigator.clipboard.writeText(settings.boardPublicUrl)
                }
              >
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  settings?.boardPublicUrl &&
                  window.open(settings.boardPublicUrl, '_blank')
                }
              >
                Open
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meeting Rooms</CardTitle>
                <CardDescription>
                  Create and manage your bookable rooms
                </CardDescription>
              </div>
              <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
                <DialogTrigger asChild>
                  <Button>Add Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>
                      Create a new bookable meeting room
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddRoom}>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">
                          Room Name *
                        </label>
                        <Input
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="e.g., Conference Room A"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Description
                        </label>
                        <Input
                          value={newRoomDescription}
                          onChange={(e) => setNewRoomDescription(e.target.value)}
                          placeholder="Optional description"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            type="color"
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            className="h-10 w-20"
                          />
                          <Input
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingRoom(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Room</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No rooms yet. Click "Add Room" to create your first room.
              </p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded"
                        style={{ backgroundColor: room.color || '#3b82f6' }}
                      />
                      <div>
                        <p className="font-medium">{room.name}</p>
                        {room.description && (
                          <p className="text-sm text-muted-foreground">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(room.id, room.isActive)
                        }
                      >
                        {room.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Polling Interval
              </span>
              <span className="text-sm font-medium">
                {settings?.pollIntervalSeconds}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Booking Durations
              </span>
              <span className="text-sm font-medium">
                {settings?.bookingDurations.join(', ')} minutes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Extend Increments
              </span>
              <span className="text-sm font-medium">
                {settings?.extendIncrements.join(', ')} minutes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
