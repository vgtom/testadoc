import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Text,
  Signature,
  Save,
  Trash2,
  Pen,
} from "lucide-react";
import { EditType, PlacedObject } from "../../types";

interface TemplateDrawerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedAsset: PlacedObject | undefined;
  inputValue: string;
  setInputValue: (value: string) => void;
  onValueChange: (value: string) => void;
  onNextAsset: () => void;
  onPreviousAsset: () => void;
  readOnly?: boolean;
}

interface DrawingState {
  isDrawing: boolean;
  context: CanvasRenderingContext2D | null;
}

const TemplateDrawer: FC<TemplateDrawerProps> = ({
  isOpen,
  setIsOpen,
  selectedAsset,
  inputValue,
  setInputValue,
  onValueChange,
  onNextAsset,
  onPreviousAsset,
  readOnly,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("draw");
  const [signatureText, setSignatureText] = useState("");
  const drawingRef = useRef<DrawingState>({
    isDrawing: false,
    context: null,
  });

  useEffect(() => {
    if (
      canvasRef.current &&
      isOpen &&
      selectedAsset?.type === EditType.TEMPLATE_SIGN &&
      signatureMode === "draw"
    ) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        drawingRef.current.context = context;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#000000";
        context.lineWidth = 2;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (inputValue && inputValue.startsWith("data:image")) {
          const img = new Image();
          img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = inputValue;
        }
      }
    }
  }, [isOpen, selectedAsset, inputValue, signatureMode]);

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly || !drawingRef.current.context) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      drawingRef.current.isDrawing = true;
      const ctx = drawingRef.current.context;
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [readOnly]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (
        !drawingRef.current.isDrawing ||
        !drawingRef.current.context ||
        readOnly
      )
        return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const ctx = drawingRef.current.context;
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [readOnly]
  );

  const stopDrawing = useCallback(() => {
    drawingRef.current.isDrawing = false;
  }, []);

  const handleClear = () => {
    if (readOnly) return;
    if (
      signatureMode === "draw" &&
      canvasRef.current &&
      drawingRef.current.context
    ) {
      const canvas = canvasRef.current;
      drawingRef.current.context.clearRect(0, 0, canvas.width, canvas.height);
    }
    onValueChange("");
    setInputValue("");
    setSignatureText("");
  };

  const handleSaveSignature = () => {
    if (readOnly) return;
    if (signatureMode === "draw" && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onValueChange(dataUrl);
    } else if (signatureMode === "type" && signatureText.trim()) {
      const canvas = document.createElement("canvas");
      canvas.width = 700;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "48px cursive";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(signatureText, canvas.width / 2, canvas.height / 2);

        const dataUrl = canvas.toDataURL("image/png");
        onValueChange(dataUrl);
      }
    }
  };

  if (!isOpen || !selectedAsset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-t-xl shadow-2xl transform transition-transform animate-in slide-in-from-bottom duration-300">
        {selectedAsset.type === EditType.TEMPLATE_DATE && (
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Date
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a date from the calendar below
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
                className="p-2"
                disabled={readOnly}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  {inputValue && (
                    <Button
                      onClick={handleClear}
                      variant="destructive"
                      className="flex items-center gap-2"
                      disabled={readOnly}
                    >
                      <X size={16} />
                      Clear Date
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={onPreviousAsset}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    onClick={onNextAsset}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <Input
                  type="date"
                  className="w-full"
                  value={inputValue}
                  onChange={(e) => onValueChange(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {readOnly
                  ? "The date is view-only as the document has been signed."
                  : "Select a date from the calendar above, and it will be applied automatically"}
              </p>
            </div>
          </>
        )}

        {selectedAsset.type === EditType.TEMPLATE_INITIAL && (
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Enter Initial
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Type your initial in the input below
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
                className="p-2"
                disabled={readOnly}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => onValueChange(inputValue)}
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <Text size={16} />
                    Save Initial
                  </Button>
                  {inputValue && (
                    <Button
                      onClick={handleClear}
                      variant="destructive"
                      className="flex items-center gap-2"
                      disabled={readOnly}
                    >
                      <X size={16} />
                      Clear Initial
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onPreviousAsset();
                      onValueChange(inputValue)
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      onNextAsset();
                      onValueChange(inputValue)
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <Input
                  type="text"
                  value={inputValue}
                  className="w-full"
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter your initial"
                  disabled={readOnly}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {readOnly
                  ? "The initial is view-only as the document has been signed."
                  : "Type your initial in the input above, then click 'Save Initial' to apply it"}
              </p>
            </div>
          </>
        )}

        {selectedAsset.type === EditType.TEMPLATE_SIGN && (
          <>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Signature
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {signatureMode === "type"
                    ? "Type your signature"
                    : "Draw your signature on the canvas below"}
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
                className="p-2"
                disabled={readOnly}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="flex gap-2 flex-wrap">
                  {!readOnly && (
                    <>
                      <Button
                        onClick={() => setSignatureMode("draw")}
                        variant={signatureMode === "draw" ? "default" : "ghost"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Pen size={16} />
                        Draw
                      </Button>
                      <Button
                        onClick={() => setSignatureMode("type")}
                        variant={signatureMode === "type" ? "default" : "ghost"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Text size={16} />
                        Type
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <Trash2 size={16} />
                    Clear
                  </Button>
                  <Button
                    onClick={handleSaveSignature}
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <Save size={16} />
                    Save
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onPreviousAsset();
                      handleSaveSignature()
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      onNextAsset();
                      handleSaveSignature()
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={readOnly}
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {signatureMode === "type" ? (
                  <Input
                    type="text"
                    value={signatureText}
                    className="w-full text-2xl font-script h-16 border-0 focus:ring-0"
                    style={{ fontFamily: "cursive" }}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Type your signature here"
                    disabled={readOnly}
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={300}
                    className={`cursor-${
                      readOnly ? "default" : "crosshair"
                    } block w-full bg-transparent`}
                    style={{ background: "transparent" }}
                    onMouseDown={(e) => {
                      if (readOnly) return;
                      e.stopPropagation();
                      startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                      if (readOnly || !drawingRef.current.isDrawing) return;
                      e.stopPropagation();
                      draw(e);
                    }}
                    onMouseUp={(e) => {
                      if (readOnly) return;
                      e.stopPropagation();
                      stopDrawing();
                    }}
                    onMouseLeave={readOnly ? undefined : stopDrawing}
                  />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {readOnly
                  ? "The signature is view-only as the document has been signed."
                  : signatureMode === "type"
                    ? "Type your signature in the input above, then click 'Save' to apply it"
                    : "Draw your signature on the canvas above, then click 'Save' to apply it"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateDrawer;
