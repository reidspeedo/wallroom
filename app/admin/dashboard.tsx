'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutEditor } from '@/components/layout-editor';
import { Logo } from '@/components/logo';
import { Settings, MoreVertical, Copy, ExternalLink, Plus, Edit2, Trash2, Share2, LogOut } from 'lucide-react';
import { SettingsPanel } from '@/components/settings-panel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  features?: string[];
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
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
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
  const [newRoomFeatures, setNewRoomFeatures] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
    setNewRoomFeatures(room.features?.join(', ') || '');
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setError('');

    try {
      const featuresArray = newRoomFeatures
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const response = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          color: newRoomColor,
          description: newRoomDescription || null,
          capacity: newRoomCapacity ? Number(newRoomCapacity) : null,
          features: featuresArray
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update room');
      }

      setNewRoomName('');
      setNewRoomColor('#8ea2c2');
      setNewRoomDescription('');
      setNewRoomCapacity('');
      setNewRoomFeatures('');
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

  const handleCopyUrl = async () => {
    if (settings?.boardPublicUrl) {
      await navigator.clipboard.writeText(settings.boardPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <Logo className="mb-3" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage rooms, settings, and view bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSettingsPanelOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <SettingsPanel 
          open={settingsPanelOpen} 
          onClose={() => setSettingsPanelOpen(false)} 
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft">
            {error}
          </div>
        )}

        {/* Share Card */}
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-600" />
                  Public Board
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Share this URL with your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-3">
              <Input
                readOnly
                value={settings?.boardPublicUrl || ''}
                className="font-mono text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  {copied ? (
                    <>
                      <span className="text-green-600">✓</span>
                    </>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    settings?.boardPublicUrl &&
                    window.open(settings.boardPublicUrl, '_blank')
                  }
                  className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Rooms</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} configured
              </p>
            </div>
            <Dialog open={isAddingRoom} onOpenChange={setIsAddingRoom}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
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
                      <div>
                        <label className="text-sm font-medium text-slate-700">Features</label>
                        <Input
                          value={newRoomFeatures}
                          onChange={(e) => setNewRoomFeatures(e.target.value)}
                          placeholder="e.g., Zoom, TV, Whiteboard (comma-separated)"
                          className="mt-1 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                        />
                        <p className="mt-1 text-xs text-slate-500">Enter features separated by commas</p>
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
        </div>

        {rooms.length === 0 ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No rooms yet</h3>
                <p className="text-slate-600 mb-4">Get started by creating your first room</p>
                <Button onClick={() => setIsAddingRoom(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="h-12 w-12 rounded-lg shadow-sm flex-shrink-0"
                        style={{ backgroundColor: room.color || '#8ea2c2' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{room.name}</h3>
                        {room.description && (
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRoom(room.id)}
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {room.capacity && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Capacity:</span>
                        <span>{room.capacity} {room.capacity === 1 ? 'seat' : 'seats'}</span>
                      </div>
                    )}
                    {room.features && room.features.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Features:</span>
                        <span className="truncate">{room.features.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Layout: {room.layoutX}%, {room.layoutY}%</span>
                      <span>•</span>
                      <span>Size: {room.layoutW}% × {room.layoutH}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">Configuration</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Update booking rules and system settings
              </CardDescription>
            </div>
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
