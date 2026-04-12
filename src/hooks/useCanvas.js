'use client';

import { useEffect, useRef, useCallback } from 'react';
import socket from '../socket/socket';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

/**
 * Manages all canvas drawing logic — both local drawing and receiving remote strokes.
 *
 * @param {boolean} isDrawer - Whether the local player is the current drawer
 * @returns {{ canvasRef, drawRemote, replayHistory }}
 */
export function useCanvas(isDrawer) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const toolRef = useRef('pen');
  const colorRef = useRef('#000000');
  const sizeRef = useRef(5);

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
    ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // ── Replay draw history (for late joiners) ──────────────────────────────────

  const replayHistory = useCallback((history) => {
    const ctx = getCtx();
    if (!ctx || !history?.length) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    history.forEach(evt => applyStroke(ctx, evt));
  }, []);

  // ── Remote draw event ──────────────────────────────────────────────────────

  const drawRemote = useCallback((data) => {
    const ctx = getCtx();
    if (!ctx) return;
    applyStroke(ctx, data);
  }, []);

  // ── Mouse event helpers ────────────────────────────────────────────────────

  function getCanvasPos(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Scale logical coords to internal canvas resolution
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
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
    // Emit to server
    socket.emit('draw', data);
  }

  // ── Mouse event listeners ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;

    function onMouseDown(e) {
      if (e.button !== 0) return;
      isDrawingRef.current = true;
      const pos = getCanvasPos(e);
      lastPosRef.current = pos;
    }

    function onMouseMove(e) {
      if (!isDrawingRef.current) return;
      const pos = getCanvasPos(e);
      emitDraw(pos.x, pos.y, lastPosRef.current.x, lastPosRef.current.y);
      lastPosRef.current = pos;
    }

    function onMouseUp() {
      isDrawingRef.current = false;
    }

    function onMouseLeave() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isDrawer]);

  // ── Socket listeners (draw + clear_canvas + draw_history) ─────────────────

  useEffect(() => {
    function onDraw(data) {
      if (!isDrawer) {
        drawRemote(data);
      }
    }

    function onClearCanvas() {
      const ctx = getCtx();
      if (ctx) ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function onDrawHistory(history) {
      replayHistory(history);
    }

    socket.on('draw', onDraw);
    socket.on('clear_canvas', onClearCanvas);
    socket.on('draw_history', onDrawHistory);

    return () => {
      socket.off('draw', onDraw);
      socket.off('clear_canvas', onClearCanvas);
      socket.off('draw_history', onDrawHistory);
    };
  }, [isDrawer, drawRemote, replayHistory]);

  return { canvasRef, setTool, setColor, setSize, replayHistory };
}
