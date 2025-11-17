import React, { useRef, useEffect, useState } from 'react';
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Undo, 
  Redo, 
  Trash2,
  Download,
  Save,
  Palette,
  X
} from 'lucide-react';

interface WhiteboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: string) => void;
  initialData?: string;
  isTeacher?: boolean;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text';

interface Point {
  x: number;
  y: number;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isTeacher = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = initialData;
    } else {
      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initialData]);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const data = canvasRef.current.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = history[historyIndex - 1];
        setHistoryIndex(historyIndex - 1);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = history[historyIndex + 1];
        setHistoryIndex(historyIndex + 1);
      }
    }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
    }
  };

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher) return;
    const point = getPointFromEvent(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (tool === 'text') {
      setTextPosition(point);
      setShowTextInput(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacher) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    const currentPoint = getPointFromEvent(e);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (tool === 'pen') {
      if (startPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        setStartPoint(currentPoint);
      }
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, lineWidth * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (tool === 'line' && startPoint) {
      // Redraw everything up to this point, then draw preview line
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      };
      img.src = history[historyIndex] || canvasRef.current.toDataURL();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacher) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current || !startPoint) return;

    const endPoint = getPointFromEvent(e);

    if (tool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(
        startPoint.x,
        startPoint.y,
        endPoint.x - startPoint.x,
        endPoint.y - startPoint.y
      );
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }

    setIsDrawing(false);
    setStartPoint(null);
    saveToHistory();
  };

  const handleTextSubmit = () => {
    if (!textInput || !textPosition) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `${lineWidth * 5}px Arial`;
      ctx.fillText(textInput, textPosition.x, textPosition.y);
      setTextInput('');
      setShowTextInput(false);
      setTextPosition(null);
      saveToHistory();
    }
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const saveCanvas = () => {
    if (!canvasRef.current || !onSave) return;
    const data = canvasRef.current.toDataURL();
    // TODO: Replace with actual API call
    // await apiService.saveWhiteboard(lessonId, data);
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Interactive Whiteboard</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        {isTeacher && (
          <div className="bg-gray-800 w-16 flex flex-col items-center py-4 space-y-4 border-r border-gray-700">
            {/* Drawing Tools */}
            <button
              onClick={() => setTool('pen')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'pen' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Pen"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Eraser"
            >
              <Eraser className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Rectangle"
            >
              <Square className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'circle' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Circle"
            >
              <Circle className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Line"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-3 rounded-lg transition-colors ${
                tool === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title="Text"
            >
              <Type className="h-5 w-5" />
            </button>

            <div className="border-t border-gray-700 my-2 w-full"></div>

            {/* Actions */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="h-5 w-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="h-5 w-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              title="Clear"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="border-t border-gray-700 my-2 w-full"></div>

            {/* Save/Download */}
            <button
              onClick={saveCanvas}
              className="p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              title="Save"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={downloadCanvas}
              className="p-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Color Palette */}
        {isTeacher && (
          <div className="bg-gray-800 w-20 flex flex-col items-center py-4 space-y-2 border-r border-gray-700">
            <Palette className="h-5 w-5 text-gray-400 mb-2" />
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  color === c ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-1">Size</label>
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 bg-white relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          />
          
          {/* Text Input Overlay */}
          {showTextInput && textPosition && (
            <div
              className="absolute bg-white border-2 border-blue-500 rounded p-2"
              style={{ left: textPosition.x, top: textPosition.y }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  } else if (e.key === 'Escape') {
                    setShowTextInput(false);
                    setTextInput('');
                  }
                }}
                autoFocus
                className="outline-none border-none"
                placeholder="Type text..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

