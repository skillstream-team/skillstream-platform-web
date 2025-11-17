import React, { useRef, useEffect, useState } from 'react';
import { Pencil, Eraser, X, Save } from 'lucide-react';

interface ScreenAnnotationProps {
  isActive: boolean;
  onClose: () => void;
  onSave?: (data: string) => void;
  screenShareElement?: HTMLVideoElement | null;
}

export const ScreenAnnotation: React.FC<ScreenAnnotationProps> = ({
  isActive,
  onClose,
  onSave,
  screenShareElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current || !screenShareElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      if (screenShareElement) {
        canvas.width = screenShareElement.offsetWidth;
        canvas.height = screenShareElement.offsetHeight;
        canvas.style.width = `${screenShareElement.offsetWidth}px`;
        canvas.style.height = `${screenShareElement.offsetHeight}px`;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isActive, screenShareElement]);

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setStartPoint(getPointFromEvent(e));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current || !startPoint) return;

    const currentPoint = getPointFromEvent(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      setStartPoint(currentPoint);
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, lineWidth * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearAnnotations = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveAnnotations = () => {
    if (!canvasRef.current || !onSave) return;
    const data = canvasRef.current.toDataURL();
    // TODO: Replace with actual API call
    // await apiService.saveScreenAnnotations(conferenceId, data);
    onSave(data);
  };

  if (!isActive) return null;

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Annotation Toolbar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-xl p-4 flex items-center space-x-4 pointer-events-auto">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Pen"
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Eraser"
        >
          <Eraser className="h-5 w-5" />
        </button>
        
        <div className="border-l border-gray-600 h-8"></div>
        
        <div className="flex items-center space-x-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-white scale-110' : 'border-gray-600'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        <div className="border-l border-gray-600 h-8"></div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-20"
        />
        
        <div className="border-l border-gray-600 h-8"></div>
        
        <button
          onClick={clearAnnotations}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
        >
          Clear
        </button>
        <button
          onClick={saveAnnotations}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center space-x-1"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-semibold"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

