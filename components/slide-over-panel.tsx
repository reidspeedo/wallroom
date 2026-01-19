'use client';

import { useState, useEffect } from 'react';
import { X, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  capacity: number | null;
  status: 'free' | 'occupied';
  currentBooking?: Booking;
  nextBooking?: Booking;
  dayBookings?: Booking[];
  features?: string[];
}

interface SlideOverPanelProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  bookingDurations: number[];
  onBook: (roomId: string, duration: number, startTime: string, title: string) => Promise<void>;
  onExtend?: (bookingId: string, increment: number) => Promise<void>;
  onEndEarly?: (bookingId: string) => Promise<void>;
  extendIncrements?: number[];
  isLoading?: boolean;
}

export function SlideOverPanel({
  room,
  isOpen,
  onClose,
  bookingDurations,
  onBook,
  onExtend,
  onEndEarly,
  extendIncrements = [],
  isLoading = false
}: SlideOverPanelProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (!isOpen || !room) {
      setSelectedDuration(null);
      setSelectedStartTime('');
      setBookingTitle('');
      setBookingError('');
    }
  }, [isOpen, room]);

  if (!isOpen || !room) return null;

  const isFree = room.status === 'free';
  const now = new Date();
  
  // Generate available time slots
  const availableSlots: { value: string; label: string }[] = [];
  if (selectedDuration && isFree) {
    const start = new Date(now);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 0, 0);
    
    while (start.getTime() + selectedDuration * 60000 <= endOfDay.getTime()) {
      const slotEnd = new Date(start.getTime() + selectedDuration * 60000);
      const isConflict = room.dayBookings?.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return (start < bookingEnd && slotEnd > bookingStart);
      });
      
      if (!isConflict) {
        availableSlots.push({
          value: start.toISOString(),
          label: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      }
      
      start.setMinutes(start.getMinutes() + 15);
    }
  }

  const handleBook = async () => {
    if (!selectedDuration || !selectedStartTime || !bookingTitle.trim()) {
      setBookingError('Please fill in all fields');
      return;
    }

    setBookingError('');
    try {
      await onBook(room.id, selectedDuration, selectedStartTime, bookingTitle);
      onClose();
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Booking failed');
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const minutes = Math.floor((end.getTime() - now.getTime()) / 60000);
    if (minutes <= 0) return 'Ending now';
    if (minutes === 1) return 'Ends in 1 min';
    return `Ends in ${minutes} min`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{room.name}</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {isFree ? 'Available now' : 'Currently in use'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Room Details */}
            <div className="space-y-4 mb-6">
              {room.capacity && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>{room.capacity} {room.capacity === 1 ? 'seat' : 'seats'}</span>
                </div>
              )}
              {room.features && room.features.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Features: {room.features.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Current Booking */}
            {room.currentBooking && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                    Current Meeting
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {room.currentBooking.title}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(room.currentBooking.startTime)} - {formatTime(room.currentBooking.endTime)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-red-600">
                    {getTimeRemaining(room.currentBooking.endTime)}
                  </p>
                </div>
                {(room.currentBooking.canExtend || room.currentBooking.canEndEarly) && (
                  <div className="mt-4 flex gap-2">
                    {room.currentBooking.canEndEarly && onEndEarly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEndEarly(room.currentBooking!.id)}
                        disabled={isLoading}
                        className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        End Now
                      </Button>
                    )}
                    {room.currentBooking.canExtend && onExtend && (
                      <div className="flex flex-1 gap-2">
                        {extendIncrements.map((increment) => (
                          <Button
                            key={increment}
                            variant="outline"
                            size="sm"
                            onClick={() => onExtend(room.currentBooking!.id, increment)}
                            disabled={isLoading}
                            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            +{increment}m
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Today's Timeline */}
            {room.dayBookings && room.dayBookings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Today's Schedule</h3>
                <div className="space-y-2">
                  {room.dayBookings.map((booking) => {
                    const isCurrent = booking.id === room.currentBooking?.id;
                    return (
                      <div
                        key={booking.id}
                        className={`rounded-md border p-3 ${
                          isCurrent
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {booking.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="text-xs font-medium text-blue-700">Now</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Availability */}
            {isFree && room.nextBooking && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Next Booking
                </p>
                <p className="text-sm text-slate-900">
                  {room.nextBooking.title} at {formatTime(room.nextBooking.startTime)}
                </p>
              </div>
            )}

            {/* Quick Book Form */}
            {isFree && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Book This Room</h3>
                
                <div className="space-y-4">
                  {/* Duration */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-2 block">
                      Duration
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {bookingDurations.map((duration) => (
                        <Button
                          key={duration}
                          variant={selectedDuration === duration ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedDuration(duration);
                            setSelectedStartTime('');
                          }}
                          type="button"
                          className={
                            selectedDuration === duration
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                          }
                        >
                          {duration}m
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Start Time */}
                  {selectedDuration && (
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-2 block">
                        Start Time
                      </label>
                      <select
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select a time</option>
                        {availableSlots.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                      {availableSlots.length === 0 && (
                        <p className="mt-2 text-sm text-slate-600">
                          No available slots for this duration today.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Meeting Title */}
                  {selectedDuration && selectedStartTime && (
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-2 block">
                        Meeting Title
                      </label>
                      <Input
                        value={bookingTitle}
                        onChange={(e) => setBookingTitle(e.target.value)}
                        placeholder="e.g., Team Standup"
                        maxLength={120}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {bookingError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {bookingError}
                    </div>
                  )}

                  {/* Book Button */}
                  {selectedDuration && selectedStartTime && bookingTitle.trim() && (
                    <Button
                      onClick={handleBook}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isLoading ? 'Booking...' : 'Book Room'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

