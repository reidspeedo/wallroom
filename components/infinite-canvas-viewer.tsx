'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfessionalRoomCard } from '@/components/professional-room-card';

interface Room {
  id: string;
  name: string;
  capacity: number | null;
  status: 'free' | 'occupied';
  color: string | null;
  currentBooking?: {
    title: string;
    endTime: string;
  };
  nextBooking?: {
    title: string;
    startTime: string;
  };
  layoutX?: number;
  layoutY?: number;
  layoutW?: number;
  layoutH?: number;
}

interface InfiniteCanvasViewerProps {
  rooms: Room[];
  onRoomClick?: (roomId: string) => void;
  selectedRoomId?: string | null;
}

// Base canvas size in pixels (world coordinates)
const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 10000;
const CANVAS_PADDING = 200;

// Convert percentage to pixel coordinates
function percentToPixels(percent: number, dimension: number): number {
  return (percent / 100) * dimension;
}

// Convert pixel coordinates to percentage
function pixelsToPercent(pixels: number, dimension: number): number {
  return (pixels / dimension) * 100;
}

export function InfiniteCanvasViewer({
  rooms,
  onRoomClick,
  selectedRoomId
}: InfiniteCanvasViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const hasAutoFittedRef = useRef(false);

  // Calculate initial viewport position based on rooms (if available)
  const getInitialViewport = useCallback(() => {
    if (rooms.length === 0) {
      return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, zoom: 1 };
    }
    
    // Convert rooms to pixels to find center
    const roomsWithCoords = rooms.filter(r => 
      r.layoutX !== undefined && r.layoutY !== undefined && 
      r.layoutW !== undefined && r.layoutH !== undefined
    );
    
    if (roomsWithCoords.length === 0) {
      return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, zoom: 1 };
    }
    
    const minX = Math.min(...roomsWithCoords.map(r => percentToPixels(r.layoutX!, CANVAS_WIDTH)));
    const minY = Math.min(...roomsWithCoords.map(r => percentToPixels(r.layoutY!, CANVAS_HEIGHT)));
    const maxX = Math.max(...roomsWithCoords.map(r => percentToPixels(r.layoutX! + r.layoutW!, CANVAS_WIDTH)));
    const maxY = Math.max(...roomsWithCoords.map(r => percentToPixels(r.layoutY! + r.layoutH!, CANVAS_HEIGHT)));
    
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      zoom: 1.0 // Start at 100% zoom
    };
  }, [rooms]);

  // Viewport state: position (in world coordinates) and zoom level
  const [viewport, setViewport] = useState(() => {
    // Calculate initial position, but we'll use a simpler approach
    return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, zoom: 1.0 };
  });

  // Convert rooms from percentage to pixel coordinates
  const roomsInPixels = useMemo(() => {
    const filtered = rooms.filter(room => 
      room.layoutX !== undefined && 
      room.layoutY !== undefined && 
      room.layoutW !== undefined && 
      room.layoutH !== undefined
    );
    const converted = filtered.map(room => {
      const x = percentToPixels(room.layoutX!, CANVAS_WIDTH);
      const y = percentToPixels(room.layoutY!, CANVAS_HEIGHT);
      const width = percentToPixels(room.layoutW!, CANVAS_WIDTH);
      const height = percentToPixels(room.layoutH!, CANVAS_HEIGHT);
      return {
        ...room,
        x,
        y,
        width,
        height
      };
    });
    return converted;
  }, [rooms]);

  // Calculate bounding box of all rooms
  const bounds = useMemo(() => {
    if (roomsInPixels.length === 0) {
      return {
        minX: CANVAS_PADDING,
        minY: CANVAS_PADDING,
        maxX: CANVAS_WIDTH - CANVAS_PADDING,
        maxY: CANVAS_HEIGHT - CANVAS_PADDING,
        width: CANVAS_WIDTH - CANVAS_PADDING * 2,
        height: CANVAS_HEIGHT - CANVAS_PADDING * 2
      };
    }

    const minX = Math.min(...roomsInPixels.map(r => r.x));
    const minY = Math.min(...roomsInPixels.map(r => r.y));
    const maxX = Math.max(...roomsInPixels.map(r => r.x + r.width));
    const maxY = Math.max(...roomsInPixels.map(r => r.y + r.height));

    return {
      minX: Math.max(0, minX - CANVAS_PADDING),
      minY: Math.max(0, minY - CANVAS_PADDING),
      maxX: Math.min(CANVAS_WIDTH, maxX + CANVAS_PADDING),
      maxY: Math.min(CANVAS_HEIGHT, maxY + CANVAS_PADDING),
      width: Math.min(CANVAS_WIDTH, maxX + CANVAS_PADDING) - Math.max(0, minX - CANVAS_PADDING),
      height: Math.min(CANVAS_HEIGHT, maxY + CANVAS_PADDING) - Math.max(0, minY - CANVAS_PADDING)
    };
  }, [roomsInPixels]);

  // Get container dimensions
  const containerSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        containerSize.current = {
          width: rect.width,
          height: rect.height
        };
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-fit to content when rooms are first loaded (only once)
  useEffect(() => {
    if (roomsInPixels.length === 0 || hasAutoFittedRef.current) {
      return;
    }
    
    const fitToContent = () => {
      if (containerRef.current && roomsInPixels.length > 0 && !hasAutoFittedRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          containerSize.current = { width: rect.width, height: rect.height };
          // Center on rooms and use 100% zoom (1.0) as default
          // This ensures rooms are visible at a reasonable size
          const newX = bounds.minX + bounds.width / 2;
          const newY = bounds.minY + bounds.height / 2;
          const newZoom = 1.0; // Start at 100% zoom - user can adjust
          
          hasAutoFittedRef.current = true;
          setViewport(prev => {
            // Only update if we haven't already fitted
            if (prev.x === CANVAS_WIDTH / 2 && prev.y === CANVAS_HEIGHT / 2 && prev.zoom === 1) {
              return { x: newX, y: newY, zoom: newZoom };
            }
            return prev;
          });
        }
      }
    };
    
    if (containerSize.current.width === 0 || containerSize.current.height === 0) {
      // Wait for container to be measured
      const timer = setTimeout(fitToContent, 100);
      return () => clearTimeout(timer);
    } else {
      // Container already measured, fit immediately
      fitToContent();
    }
  }, [roomsInPixels.length, bounds]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    isPanningRef.current = true;
    lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return;

    const deltaX = e.clientX - lastPanPointRef.current.x;
    const deltaY = e.clientY - lastPanPointRef.current.y;

    setViewport(prev => {
      const newX = prev.x - deltaX / prev.zoom;
      const newY = prev.y - deltaY / prev.zoom;
      
      // Constrain to canvas bounds
      const maxX = CANVAS_WIDTH;
      const maxY = CANVAS_HEIGHT;
      const minX = 0;
      const minY = 0;

      return {
        ...prev,
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY))
      };
    });

    lastPanPointRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isPanningRef.current = true;
    const touch = e.touches[0];
    lastPanPointRef.current = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanningRef.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastPanPointRef.current.x;
    const deltaY = touch.clientY - lastPanPointRef.current.y;

    setViewport(prev => {
      const newX = prev.x - deltaX / prev.zoom;
      const newY = prev.y - deltaY / prev.zoom;
      
      // Constrain to canvas bounds
      const maxX = CANVAS_WIDTH;
      const maxY = CANVAS_HEIGHT;
      const minX = 0;
      const minY = 0;

      return {
        ...prev,
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY))
      };
    });

    lastPanPointRef.current = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));

    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = viewport.x + (mouseX - rect.width / 2) / viewport.zoom;
      const worldY = viewport.y + (mouseY - rect.height / 2) / viewport.zoom;

      setViewport({
        x: worldX - (mouseX - rect.width / 2) / newZoom,
        y: worldY - (mouseY - rect.height / 2) / newZoom,
        zoom: newZoom
      });
    }
  }, [viewport]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.2)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2)
    }));
  }, []);

  const handleFitToContent = useCallback(() => {
    if (containerSize.current.width === 0 || containerSize.current.height === 0) return;
    if (roomsInPixels.length === 0) return;

    const padding = 100;
    const scaleX = (containerSize.current.width - padding * 2) / bounds.width;
    const scaleY = (containerSize.current.height - padding * 2) / bounds.height;
    let newZoom = Math.min(scaleX, scaleY, 2);
    // If calculated zoom is too small, use a default of 1.0 (100%)
    if (newZoom < 0.5) {
      newZoom = 1.0;
    }

    setViewport({
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2,
      zoom: newZoom
    });
  }, [bounds, roomsInPixels.length]);

  const handleResetView = useCallback(() => {
    setViewport({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      zoom: 1
    });
  }, []);

  // Determine zoom level for room card simplification
  const getZoomLevel = (zoom: number): 'low' | 'medium' | 'high' => {
    if (zoom < 0.5) return 'low';
    if (zoom < 1.5) return 'medium';
    return 'high';
  };

  const zoomLevel = getZoomLevel(viewport.zoom);
  const [zoomInput, setZoomInput] = useState('');

  // Sync zoom input with viewport zoom
  useEffect(() => {
    setZoomInput(Math.round(viewport.zoom * 100).toString());
  }, [viewport.zoom]);

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value);
  };

  const handleZoomInputBlur = () => {
    const numValue = parseFloat(zoomInput);
    if (!isNaN(numValue) && numValue > 0) {
      const newZoom = Math.max(0.1, Math.min(5, numValue / 100));
      setViewport(prev => ({ ...prev, zoom: newZoom }));
    } else {
      // Reset to current zoom if invalid
      setZoomInput(Math.round(viewport.zoom * 100).toString());
    }
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-slate-100"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${-viewport.x}px, ${-viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`
          }}
        >
          {/* Rooms */}
          {roomsInPixels.map((room) => {
            const isSelected = selectedRoomId === room.id;

            return (
              <div
                key={room.id}
                className={`absolute ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 ring-offset-2 z-10' 
                    : ''
                }`}
                style={{
                  left: `${room.x}px`,
                  top: `${room.y}px`,
                  width: `${room.width}px`,
                  height: `${room.height}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRoomClick?.(room.id);
                }}
              >
                {/* ProfessionalRoomCard fills its container using percentage positioning */}
                <ProfessionalRoomCard
                  room={{
                    ...room,
                    layoutX: 0,
                    layoutY: 0,
                    layoutW: 100,
                    layoutH: 100
                  }}
                  onClick={() => onRoomClick?.(room.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px bg-slate-200" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFitToContent}
          className="h-8 w-8"
          title="Fit to content"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          className="h-8 w-8"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom level indicator with input */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <span className="text-xs font-medium text-slate-600">Zoom:</span>
        <input
          type="text"
          value={zoomInput}
          onChange={handleZoomInputChange}
          onBlur={handleZoomInputBlur}
          onKeyDown={handleZoomInputKeyDown}
          className="w-12 rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs font-medium text-slate-600">%</span>
      </div>
    </div>
  );
}

