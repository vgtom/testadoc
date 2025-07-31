import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Circle, Pencil, Save, Square } from "lucide-react";
import { Asset, EditType } from "../types";

type DrawingPanelProp = {
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  setShowDrawingPanel: React.Dispatch<React.SetStateAction<boolean>>;
};

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  context: CanvasRenderingContext2D | null;
}

interface DrawingTool {
  type: "pen" | "rectangle" | "circle";
  color: string;
  size: number;
}

const DrawingPanel: FC<DrawingPanelProp> = ({
  setAssets,
  setShowDrawingPanel,
}) => {
  const [currentDrawingTool, setCurrentDrawingTool] = useState<DrawingTool>({
    type: "pen",
    color: "#000000",
    size: 2,
  });

  const drawingRef = useRef<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    context: null,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        drawingRef.current.context = context;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = currentDrawingTool.color;
        context.lineWidth = currentDrawingTool.size;
      }
    }
  }, [currentDrawingTool.color, currentDrawingTool.size]);

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current.context) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawingRef.current.isDrawing = true;
      drawingRef.current.startX = x;
      drawingRef.current.startY = y;
      const ctx = drawingRef.current.context;
      ctx.strokeStyle = currentDrawingTool.color;
      ctx.lineWidth = currentDrawingTool.size;
      if (currentDrawingTool.type === "pen") {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    },
    [currentDrawingTool.color, currentDrawingTool.size, currentDrawingTool.type]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current.isDrawing || !drawingRef.current.context) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ctx = drawingRef.current.context;
      if (currentDrawingTool.type === "pen") {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const startX = drawingRef.current.startX;
        const startY = drawingRef.current.startY;
        const width = x - startX;
        const height = y - startY;
        ctx.beginPath();
        if (currentDrawingTool.type === "rectangle") {
          ctx.rect(startX, startY, width, height);
        } else if (currentDrawingTool.type === "circle") {
          const radius = Math.sqrt(width * width + height * height);
          ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
      }
    },
    [currentDrawingTool.type]
  );

  const stopDrawing = () => {
    drawingRef.current.isDrawing = false;
  };

  const clearCanvas = useCallback(() => {
    if (drawingRef.current.context && canvasRef.current) {
      drawingRef.current.context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  }, []);

  const saveDrawingAsAsset = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const newAsset: Asset = {
      id: Date.now().toString(),
      dataUrl,
      type: EditType.IMAGE
    };
    setAssets((prev) => [...prev, newAsset]);
    clearCanvas();
    setShowDrawingPanel(false);
  }, [clearCanvas]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Draw Asset</h3>

          <div className="flex gap-2">
            <Button
              onClick={clearCanvas}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </Button>
            <Button
              onClick={saveDrawingAsAsset}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save size={16} /> Save to Assets
            </Button>
            <Button
              onClick={() => setShowDrawingPanel(false)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancel
            </Button>
          </div>
        </div>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium mb-3 text-gray-700">Drawing Tool</h4>
          <div className="flex gap-2 mb-3">
            {[
              { type: "pen" as const, icon: Pencil, label: "Pen" },
              {
                type: "rectangle" as const,
                icon: Square,
                label: "Rectangle",
              },
              { type: "circle" as const, icon: Circle, label: "Circle" },
            ].map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                onClick={() =>
                  setCurrentDrawingTool((prev) => ({ ...prev, type }))
                }
                className={`p-2 rounded-lg transition-colors ${
                  currentDrawingTool.type === type
                    ? "bg-blue-500 text-white"
                    : "bg-white border hover:bg-gray-100"
                }`}
                title={label}
              >
                <Icon size={16} />
              </Button>
            ))}
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Color:
            </label>
            <input
              type="color"
              value={currentDrawingTool.color}
              onChange={(e) =>
                setCurrentDrawingTool((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
              className="w-full h-10 rounded-lg border"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Size: {currentDrawingTool.size}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={currentDrawingTool.size}
              onChange={(e) =>
                setCurrentDrawingTool((prev) => ({
                  ...prev,
                  size: parseInt(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
        </div>
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            className="bg-white cursor-crosshair block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Draw on the canvas above, then click "Save to Assets" to add it to the
          assets list
        </p>
      </div>
    </div>
  );
};

export default DrawingPanel;
