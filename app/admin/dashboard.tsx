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
  const [newRoomColor, setNewRoomColor] = useState('#8ea2c2');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number | ''>('');

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
      setNewRoomColor('#8ea2c2');
      setNewRoomDescription('');
      setNewRoomCapacity('');
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
    setNewRoomColor(room.color || '#8ea2c2');
    setNewRoomDescription(room.description || '');
    setNewRoomCapacity(room.capacity || '');
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
          description: newRoomDescription || null,
          capacity: newRoomCapacity ? Number(newRoomCapacity) : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update room');
      }

      setNewRoomName('');
      setNewRoomColor('#8ea2c2');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-base text-slate-600">
              Manage rooms, settings, and view bookings
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            Logout
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft">
            {error}
          </div>
        )}

        {/* Board URL Card */}
        <Card className="border-slate-200 bg-white shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-900">Public Board URL</CardTitle>
            <CardDescription className="text-slate-600">
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
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  settings?.boardPublicUrl &&
                  window.open(settings.boardPublicUrl, '_blank')
                }
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Open
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Management */}
        <Card className="border-slate-200 bg-white shadow-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Meeting Rooms</CardTitle>
                <CardDescription className="text-slate-600">
                  Create rooms and configure their layout order
                </CardDescription>
              </div>
              <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary shadow-soft hover:opacity-90">
                    Add Room
                  </Button>
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
                          className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Capacity</label>
                        <Input
                          type="number"
                          min={1}
                          value={newRoomCapacity}
                          onChange={(e) => setNewRoomCapacity(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g., 8"
                          className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Color</label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            type="color"
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer rounded-xl border-slate-200"
                          />
                          <Input
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            placeholder="#8ea2c2"
                            className="flex-1 border-slate-200 bg-white font-mono focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingRoom(false)}
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="gradient-primary shadow-soft hover:opacity-90">Create Room</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
                <DialogContent className="border-slate-200 bg-white shadow-elevated">
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold text-slate-900">Edit Room</DialogTitle>
                    <DialogDescription className="text-slate-600">
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
                          className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Capacity</label>
                        <Input
                          type="number"
                          min={1}
                          value={newRoomCapacity}
                          onChange={(e) => setNewRoomCapacity(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g., 8"
                          className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Color</label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            type="color"
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer rounded-xl border-slate-200"
                          />
                          <Input
                            value={newRoomColor}
                            onChange={(e) => setNewRoomColor(e.target.value)}
                            placeholder="#8ea2c2"
                            className="flex-1 border-slate-200 bg-white font-mono focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingRoom(null)}
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="gradient-primary shadow-soft hover:opacity-90">Update Room</Button>
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
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:shadow-elevated"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded"
                        style={{ backgroundColor: room.color || '#8ea2c2' }}
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
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
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
        <Card className="border-slate-200 bg-white shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-900">Room Layout Editor</CardTitle>
            <CardDescription className="text-slate-600">
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
                  <label className="text-sm font-medium text-slate-700">X (%)</label>
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
                    className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Y (%)</label>
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
                    className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Width (%)</label>
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
                    className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Height (%)</label>
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
                    className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="border-slate-200 bg-white shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-900">Settings</CardTitle>
            <CardDescription className="text-slate-600">
              Update booking rules and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Time Zone</label>
                <Input
                  value={settingsDraft.timeZone}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      timeZone: e.target.value
                    }))
                  }
                  placeholder="e.g., America/New_York"
                  className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
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
                  className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
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
                  className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings} 
                disabled={settingsSaving}
                className="gradient-primary shadow-soft hover:opacity-90"
              >
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
