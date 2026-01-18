'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutEditor } from '@/components/layout-editor';
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
  layoutX: number;
  layoutY: number;
  layoutW: number;
  layoutH: number;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  timeZone: string | null;
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
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    timeZone: '',
    bookingDurations: '',
    extendIncrements: ''
  });
  const [activeLayoutRoomId, setActiveLayoutRoomId] = useState<string | null>(
    null
  );
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);

  // Room form state
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomColor, setNewRoomColor] = useState('#3b82f6');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Update canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (layoutContainerRef.current) {
        const rect = layoutContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
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
      setSettingsDraft({
        timeZone: settingsData.timeZone || '',
        bookingDurations: settingsData.bookingDurations.join(', '),
        extendIncrements: settingsData.extendIncrements.join(', ')
      });
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

  const parseNumberList = (value: string) => {
    const numbers = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => Number(item));

    if (
      numbers.length === 0 ||
      numbers.some((num) => Number.isNaN(num) || num <= 0)
    ) {
      return null;
    }

    return numbers;
  };

  const handleSaveSettings = async () => {
    setError('');
    setSettingsSaving(true);

    const bookingDurations = parseNumberList(settingsDraft.bookingDurations);
    const extendIncrements = parseNumberList(settingsDraft.extendIncrements);

    if (!bookingDurations || !extendIncrements) {
      setError('Settings lists must be valid comma-separated numbers');
      setSettingsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeZone: settingsDraft.timeZone || null,
          bookingDurations,
          extendIncrements
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update settings'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoomName(room.name);
    setNewRoomColor(room.color || '#3b82f6');
    setNewRoomDescription(room.description || '');
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setError('');

    try {
      const response = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          color: newRoomColor,
          description: newRoomDescription || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update room');
      }

      setNewRoomName('');
      setNewRoomColor('#3b82f6');
      setNewRoomDescription('');
      setEditingRoom(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room');
    }
  };

  const updateRoomLayout = (
    roomId: string,
    updates: Partial<Pick<Room, 'layoutX' | 'layoutY' | 'layoutW' | 'layoutH'>>
  ) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              ...updates
            }
          : room
      )
    );
  };

  const handleRoomLayoutUpdate = async (
    roomId: string,
    updates: Partial<Pick<Room, 'layoutX' | 'layoutY' | 'layoutW' | 'layoutH'>>
  ) => {
    // Update local state immediately for responsive UI
    updateRoomLayout(roomId, updates);

    // Persist to server
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update room layout');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update room layout'
      );
      // Reload data on error to revert
      await loadData();
    }
  };


  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      // Remove from local state immediately
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
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

  const activeLayoutRoom = rooms.find((room) => room.id === activeLayoutRoomId);

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
                  Create rooms and configure their layout order
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
              <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Room</DialogTitle>
                    <DialogDescription>
                      Update room details
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateRoom}>
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
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingRoom(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Update Room</Button>
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
                {rooms.map((room, index) => (
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
                        onClick={() => handleEditRoom(room)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
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

        {/* Layout Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Room Layout Editor</CardTitle>
            <CardDescription>
              Drag rooms to position them and resize by dragging the corners. Click a room to select it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={layoutContainerRef}
              className="w-full overflow-auto rounded-lg border bg-gray-50 p-4"
            >
              <LayoutEditor
                rooms={rooms}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                onRoomUpdate={handleRoomLayoutUpdate}
                onRoomSelect={setActiveLayoutRoomId}
                selectedRoomId={activeLayoutRoomId}
              />
            </div>

            {activeLayoutRoom && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium">X (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={activeLayoutRoom.layoutX}
                    onChange={(e) =>
                      handleRoomLayoutUpdate(activeLayoutRoom.id, {
                        layoutX: Number(e.target.value)
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Y (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={activeLayoutRoom.layoutY}
                    onChange={(e) =>
                      handleRoomLayoutUpdate(activeLayoutRoom.id, {
                        layoutY: Number(e.target.value)
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Width (%)</label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={activeLayoutRoom.layoutW}
                    onChange={(e) =>
                      handleRoomLayoutUpdate(activeLayoutRoom.id, {
                        layoutW: Number(e.target.value)
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height (%)</label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={activeLayoutRoom.layoutH}
                    onChange={(e) =>
                      handleRoomLayoutUpdate(activeLayoutRoom.id, {
                        layoutH: Number(e.target.value)
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Update booking rules and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Time Zone</label>
                <Input
                  value={settingsDraft.timeZone}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      timeZone: e.target.value
                    }))
                  }
                  placeholder="e.g., America/New_York"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Booking Durations (minutes)
                </label>
                <Input
                  value={settingsDraft.bookingDurations}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      bookingDurations: e.target.value
                    }))
                  }
                  placeholder="e.g., 15, 30, 60"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Extend Increments (minutes)
                </label>
                <Input
                  value={settingsDraft.extendIncrements}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      extendIncrements: e.target.value
                    }))
                  }
                  placeholder="e.g., 15, 30"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
