# Admin Dashboard and Public Board Cleanup

**Date:** 2025-01-17

## Summary

Cleaned up the admin dashboard and public board interface based on user feedback. Removed unnecessary features and simplified the room management workflow.

## Changes Made

### Admin Dashboard

1. **Room Management**
   - Removed activate/deactivate functionality
   - Delete button now permanently deletes rooms (not just deactivates)
   - Rooms are immediately removed from the UI when deleted
   - Removed `handleToggleActive` function

2. **Settings**
   - Removed "Polling Interval" setting
   - Removed "Layout Columns" setting
   - Settings now only include:
     - Time Zone
     - Booking Durations
     - Extend Increments

### Public Board

1. **Layout Display**
   - Removed column-based grid layout section
   - Only the office layout (visual floorplan) is now displayed
   - Users interact with rooms directly on the layout

### API Changes

1. **`/api/admin/rooms/[roomId]` (DELETE)**
   - Now always deletes rooms (no deactivation fallback)
   - Cascade deletes handle related bookings

2. **`/api/admin/settings`**
   - Removed `pollIntervalSeconds` from GET and PUT
   - Removed `layoutColumns` from GET and PUT

3. **`/api/board/[token]/state`**
   - Removed `layoutColumns` from response

### Database Schema

- No schema changes required
- `isActive`, `pollIntervalSeconds`, and `layoutColumns` fields remain in database for backward compatibility but are no longer used in the UI

## Benefits

1. **Simpler UI**: Less clutter, more focused on essential features
2. **Clearer workflow**: Delete means delete, no confusion about activation states
3. **Better UX**: Visual layout is the primary interface, no redundant column view
4. **Cleaner code**: Removed unused validation and state management

