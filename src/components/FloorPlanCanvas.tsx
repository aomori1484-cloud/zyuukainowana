import { useEffect, useRef, useState } from 'react';
import { WallSegment } from '../store/useAppStore';

interface FloorPlanCanvasProps {
  walls: WallSegment[];
  width: number;
  height: number;
  editable?: boolean;
  onWallUpdate?: (walls: WallSegment[]) => void;
}

function FloorPlanCanvas({
  walls,
  width,
  height,
  editable = false,
  onWallUpdate,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{
    wallId: string;
    point: 'start' | 'end';
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Calculate scale to fit
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight || 500;
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      setScale(Math.min(scaleX, scaleY, 1) * 0.9);
    }
  }, [width, height]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * scale * dpr;
    canvas.height = height * scale * dpr;
    canvas.style.width = `${width * scale}px`;
    canvas.style.height = `${height * scale}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width * scale, height * scale);

    // Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 50 * scale;
    for (let x = 0; x < width * scale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + offset.x, 0);
      ctx.lineTo(x + offset.x, height * scale);
      ctx.stroke();
    }
    for (let y = 0; y < height * scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset.y);
      ctx.lineTo(width * scale, y + offset.y);
      ctx.stroke();
    }

    // Draw walls
    walls.forEach((wall) => {
      const x1 = wall.start.x * scale + offset.x;
      const y1 = wall.start.y * scale + offset.y;
      const x2 = wall.end.x * scale + offset.x;
      const y2 = wall.end.y * scale + offset.y;

      // Wall line
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = Math.max(wall.thickness * scale * 0.3, 3);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Endpoints (if editable)
      if (editable) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Scale indicator
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('1m', 10, height * scale - 20);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    const meterPx = 100 * scale; // approximate
    ctx.beginPath();
    ctx.moveTo(10, height * scale - 10);
    ctx.lineTo(10 + meterPx, height * scale - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, height * scale - 14);
    ctx.lineTo(10, height * scale - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10 + meterPx, height * scale - 14);
    ctx.lineTo(10 + meterPx, height * scale - 6);
    ctx.stroke();
  }, [walls, width, height, scale, offset, editable]);

  // Mouse handling for editing
  const getCanvasPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!editable) return;

    const point = getCanvasPoint(e);
    const hitRadius = 10 / scale;

    for (const wall of walls) {
      if (Math.hypot(wall.start.x - point.x, wall.start.y - point.y) < hitRadius) {
        setDragging({ wallId: wall.id, point: 'start' });
        return;
      }
      if (Math.hypot(wall.end.x - point.x, wall.end.y - point.y) < hitRadius) {
        setDragging({ wallId: wall.id, point: 'end' });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: offset.x + (e.clientX - lastPanPoint.x),
        y: offset.y + (e.clientY - lastPanPoint.y),
      });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!dragging || !onWallUpdate) return;
    const point = getCanvasPoint(e);
    const updated = walls.map((w) => {
      if (w.id === dragging.wallId) {
        return {
          ...w,
          [dragging.point]: { x: Math.round(point.x), y: Math.round(point.y) },
        };
      }
      return w;
    });
    onWallUpdate(updated);
  };

  const handleMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(0.2, Math.min(3, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-gray-200 bg-white"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="cursor-crosshair"
      />
    </div>
  );
}

export default FloorPlanCanvas;
