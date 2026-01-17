# 2026-01-17 - Time slots, settings, layout

## Summary
- Added start-time slot booking on the public board using same-day availability.
- Added editable settings in the admin dashboard (polling, durations, increments, layout columns, time zone).
- Added layout controls by reordering rooms and configuring board columns.

## Data changes
- `UserSetting` now includes `layoutColumns` with a default of `3`.

## API changes
- Board state now returns `layoutColumns` and per-room `dayBookings` for slot availability.
- Room booking API accepts optional `startTime` to create scheduled bookings.
- Settings API now returns and updates `layoutColumns`.

## UI changes
- Admin dashboard includes a settings form and room order controls.
- Public board renders rooms in the configured grid columns and allows choosing a start time slot.

