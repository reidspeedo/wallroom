# Control Bar Updates

**Date:** 2025-01-18

## Changes Made

### Removed Features
1. **"Now / Next 30" time range selector** - Removed the quick time range buttons that allowed filtering by "Now" or "Next 30 minutes"
2. **Minimum capacity filter** - Removed the input field and label for filtering rooms by minimum capacity
3. **Available only checkbox** - Removed the checkbox toggle for showing only available rooms
4. **Time range filter** - Removed start time and end time input fields (removed due to functionality issues)

### UI Improvements
1. **Header alignment** - Changed from right-aligned (`justify-end`) back to left-aligned for better visual appearance
   - Controls now flow naturally from left to right

## Files Modified

### `components/control-bar.tsx`
- Removed `showAvailableOnly`, `minCapacity`, `timeRange` props and related UI elements
- Removed `startTime`, `endTime` props and time filter UI (removed due to functionality issues)
- Removed unused `Clock` icon import from lucide-react
- Removed `Input` component import (no longer needed)
- Changed flex container back to default left alignment (removed `justify-end`)
- Simplified component interface to only include date picker and view toggle

### `app/board/[token]/page.tsx`
- Removed state variables: `showAvailableOnly`, `minCapacity`, `timeRange`, `startTime`, `endTime`
- Removed room filtering logic (now shows all rooms)
- Updated `ControlBar` component props to match simplified interface
- Fixed type compatibility issue with `RoomListView` component

### `components/room-list-view.tsx`
- Updated `Room` interface to include `color`, `isActive`, and `dayBookings` properties for type compatibility

## Technical Details

### Room Display
- All rooms are now displayed without any filtering
- The `filteredRooms` variable now simply returns all rooms from `boardState?.rooms`

### Type Safety
Fixed TypeScript type compatibility issues by:
- Updating `RoomListView` interface to match the full `Room` type from the page component
- Using a wrapper function in `onRoomClick` to ensure type compatibility

