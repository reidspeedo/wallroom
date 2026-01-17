# 2026-01-17 - Room layout editor + board floorplan

## Summary
- Added room layout fields (X/Y/width/height as percentages) and defaults.
- Added admin floorplan editor with drag-to-position rooms and size controls.
- Public board now renders a floorplan view using stored room layout.

## Data updates
- `Room` now includes `layoutX`, `layoutY`, `layoutW`, and `layoutH`.

## UI updates
- Admin dashboard includes a layout editor card for arranging rooms visually.
- Board shows an “Office Layout” section that mirrors the configured layout.

