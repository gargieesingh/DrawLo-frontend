'use client';

import { useEffect, useRef, useCallback } from 'react';
import socket from '../socket/socket';

// ── Flood-fill (paint bucket) implementation ───────────────────────────────────

/**
 * Executes a flood-fill on a canvas context starting at (startX, startY)
 * filling with the given hex color string.
 */
function floodFill(ctx, startX, startY, fillColor, canvasWidth, canvasHeight) {
  startX = Math.round(startX);
  startY = Math.round(startY);

  const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imgData.data;

  // Parse the fill color hex to r,g,b
  const fc = fillColor.replace('#', '');
  const fillR = parseInt(fc.substring(0, 2), 16);
  const fillG = parseInt(fc.substring(2, 4), 16);
  const fillB = parseInt(fc.substring(4, 6), 16);

  const idx = (startY * canvasWidth + startX) * 4;
  const targR = data[idx];
  const targG = data[idx + 1];
  const targB = data[idx + 2];
  const targA = data[idx + 3];

  // Already the same color — nothing to do
  if (targR === fillR && targG === fillG && targB === fillB && targA === 255) return;

  const tolerance = 32; // allow slight anti-aliasing differences

  function matchTarget(i) {
    return (
      Math.abs(data[i]     - targR) <= tolerance &&
      Math.abs(data[i + 1] - targG) <= tolerance &&
      Math.abs(data[i + 2] - targB) <= tolerance &&
      Math.abs(data[i + 3] - targA) <= tolerance
    );
  }

  const stack = [[startX, startY]];
  const visited = new Uint8Array(canvasWidth * canvasHeight);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= canvasWidth || cy >= canvasHeight) continue;
    const vi = cy * canvasWidth + cx;
    if (visited[vi]) continue;
    const pi = vi * 4;
    if (!matchTarget(pi)) continue;

    visited[vi] = 1;
    data[pi]     = fillR;
    data[pi + 1] = fillG;
    data[pi + 2] = fillB;
    data[pi + 3] = 255;

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  ctx.putImageData(imgData, 0, 0);
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

/**
 * Manages all canvas drawing logic — both local drawing and receiving remote strokes.
 *
 * @param {boolean} isDrawer - Whether the local player is the current drawer
 * @returns {{ canvasRef, drawRemote, replayHistory, undo }}
 */
export function useCanvas(isDrawer) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const toolRef = useRef('pen');
  const colorRef = useRef('#000000');
  const sizeRef = useRef(5);

  // Undo stack: array of stroke segments. Each segment is an array of draw events.
  // A new segment starts on mousedown/touchstart and closes on mouseup/touchend.
  const strokeSegmentsRef = useRef([]);  // [ [evt, evt, ...], [evt, ...], ... ]
  const currentSegmentRef = useRef([]);  // strokes for the currently active drag

  // Exposed setters so Toolbar can update tool/color/size
  const setTool = useCallback((t) => { toolRef.current = t; }, []);
  const setColor = useCallback((c) => { colorRef.current = c; }, []);
  const setSize = useCallback((s) => { sizeRef.current = s; }, []);

  // ── Rendering helpers ──────────────────────────────────────────────────────

  function getCtx() {
    return canvasRef.current?.getContext('2d');
  }

  function applyStroke(ctx, data) {
    ctx.beginPath();
    ctx.moveTo(data.lastX, data.lastY);
    ctx.lineTo(data.x, data.y);
    if (data.tool === 'fill') return; // fill events are handled separately
    ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // ── Replay draw history (for late joiners) ──────────────────────────────────

  // Replays a flat list of draw events, rebuilding the undo stack as segments.
  // Fill events are treated as single-event segments.
  const replayHistory = useCallback((history) => {
    const ctx = getCtx();
    if (!ctx || !history?.length) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Rebuild undo stack from history: each fill is its own segment;
    // consecutive non-fill events are grouped into one segment.
    const segments = [];
    let seg = [];
    history.forEach(evt => {
      if (evt.tool === 'fill') {
        if (seg.length) { segments.push(seg); seg = []; }
        segments.push([evt]);
        floodFill(ctx, evt.x, evt.y, evt.color, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        seg.push(evt);
        applyStroke(ctx, evt);
      }
    });
    if (seg.length) segments.push(seg);
    strokeSegmentsRef.current = segments;
    currentSegmentRef.current = [];
  }, []);

  // ── Remote draw event ──────────────────────────────────────────────────────

  const drawRemote = useCallback((data) => {
    const ctx = getCtx();
    if (!ctx) return;
    applyStroke(ctx, data);
  }, []);

  // ── Coordinate helpers ─────────────────────────────────────────────────────

  function getCanvasPos(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Scale logical coords to internal canvas resolution
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function emitDraw(x, y, lastX, lastY) {
    const data = {
      tool: toolRef.current,
      x, y, lastX, lastY,
      color: colorRef.current,
      size: sizeRef.current,
    };
    // Draw locally
    const ctx = getCtx();
    if (ctx) applyStroke(ctx, data);
    // Track for undo
    currentSegmentRef.current.push(data);
    // Emit to server
    socket.emit('draw', data);
  }

  function emitFill(x, y) {
    const data = {
      tool: 'fill',
      x, y,
      color: colorRef.current,
    };
    // Fill locally
    const ctx = getCtx();
    if (ctx) floodFill(ctx, x, y, data.color, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Fill is its own undo segment
    strokeSegmentsRef.current.push([data]);
    // Emit to server so other clients can replay it
    socket.emit('draw', data);
  }

  // ── Mouse & Touch event listeners ─────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;

    function onMouseDown(e) {
      if (e.button !== 0) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      if (toolRef.current === 'fill') {
        emitFill(pos.x, pos.y);
        return;
      }
      isDrawingRef.current = true;
      currentSegmentRef.current = [];  // start new segment
      lastPosRef.current = pos;
    }

    function onMouseMove(e) {
      if (!isDrawingRef.current) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      emitDraw(pos.x, pos.y, lastPosRef.current.x, lastPosRef.current.y);
      lastPosRef.current = pos;
    }

    function onMouseUp() {
      if (isDrawingRef.current && currentSegmentRef.current.length > 0) {
        strokeSegmentsRef.current.push([...currentSegmentRef.current]);
        currentSegmentRef.current = [];
      }
      isDrawingRef.current = false;
    }

    function onMouseLeave() {
      if (isDrawingRef.current && currentSegmentRef.current.length > 0) {
        strokeSegmentsRef.current.push([...currentSegmentRef.current]);
        currentSegmentRef.current = [];
      }
      isDrawingRef.current = false;
    }

    // ── Touch event listeners (mobile/tablet support) ──────────────────────

    function onTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getCanvasPos(touch.clientX, touch.clientY);
      if (toolRef.current === 'fill') {
        emitFill(pos.x, pos.y);
        return;
      }
      isDrawingRef.current = true;
      currentSegmentRef.current = [];  // start new segment
      lastPosRef.current = pos;
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const touch = e.touches[0];
      const pos = getCanvasPos(touch.clientX, touch.clientY);
      emitDraw(pos.x, pos.y, lastPosRef.current.x, lastPosRef.current.y);
      lastPosRef.current = pos;
    }

    function onTouchEnd() {
      if (isDrawingRef.current && currentSegmentRef.current.length > 0) {
        strokeSegmentsRef.current.push([...currentSegmentRef.current]);
        currentSegmentRef.current = [];
      }
      isDrawingRef.current = false;
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);

      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDrawer]);

  // ── Undo ───────────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (strokeSegmentsRef.current.length === 0) return;
    strokeSegmentsRef.current.pop();

    // Flatten remaining segments into a single ordered history array
    const remainingHistory = strokeSegmentsRef.current.flat();

    // Redraw locally from remaining history
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    remainingHistory.forEach(evt => {
      if (evt.tool === 'fill') {
        floodFill(ctx, evt.x, evt.y, evt.color, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        applyStroke(ctx, evt);
      }
    });

    // Send remaining history to server — it will replace drawHistory and
    // broadcast to all other clients so their canvases update too.
    socket.emit('undo', remainingHistory);
  }, []);

  // ── Socket listeners (draw + clear_canvas + undo) ──────────────────────────

  useEffect(() => {
    function onDraw(data) {
      if (!isDrawer) {
        if (data.tool === 'fill') {
          const ctx = getCtx();
          if (ctx) floodFill(ctx, data.x, data.y, data.color, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
          drawRemote(data);
        }
      }
    }

    function onClearCanvas() {
      const ctx = getCtx();
      if (ctx) ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      strokeSegmentsRef.current = [];
      currentSegmentRef.current = [];
    }

    // Undo broadcast from server — redraw the remaining history on viewer canvases
    function onUndo(history) {
      if (!isDrawer) {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        (history || []).forEach(evt => {
          if (evt.tool === 'fill') {
            floodFill(ctx, evt.x, evt.y, evt.color, CANVAS_WIDTH, CANVAS_HEIGHT);
          } else {
            applyStroke(ctx, evt);
          }
        });
      }
    }

    socket.on('draw', onDraw);
    socket.on('clear_canvas', onClearCanvas);
    socket.on('undo', onUndo);

    return () => {
      socket.off('draw', onDraw);
      socket.off('clear_canvas', onClearCanvas);
      socket.off('undo', onUndo);
    };
  }, [isDrawer, drawRemote]);

  return { canvasRef, setTool, setColor, setSize, replayHistory, undo };
}
