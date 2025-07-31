import useDebouncedCallback from "../../../hooks/useDebouncedCallback";
import { useEffect, useRef, useState } from "react";
import { Calendar, Signature, Text, X, Move, Settings } from "lucide-react";
import { Asset, EditType, PlacedObject } from "../types";
import { makeColorTransparent } from "../../../lib/utils";

interface PlacedImageProps {
  placedAsset: PlacedObject;
  asset: Asset | undefined;
  pageWidth: number;
  pageHeight: number;
  isSelected: boolean;
  setSelectedObject: (id: string | null) => void;
  updateObjectPosition: (
    id: string,
    xPercent: number,
    yPercent: number
  ) => void;
  onDelete?: (id: string) => void;
  onResize?: (id: string, widthPercent: number, heightPercent: number) => void;
  isReadOnly?: boolean;
}

export const PlacedObjectComponent: React.FC<PlacedImageProps> = ({
  placedAsset,
  asset,
  pageWidth,
  pageHeight,
  isSelected,
  setSelectedObject,
  updateObjectPosition: updateImagePosition,
  onDelete,
  onResize,
  isReadOnly = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const [left, setLeft] = useState(placedAsset.xPercent * pageWidth);
  const [top, setTop] = useState(placedAsset.yPercent * pageHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Store current dimensions in state for real-time updates
  const [currentWidth, setCurrentWidth] = useState(
    placedAsset.widthPercent * pageWidth
  );
  const [currentHeight, setCurrentHeight] = useState(
    placedAsset.heightPercent * pageHeight
  );

  const debouncedUpdate = useDebouncedCallback(updateImagePosition, 300);
  const debouncedResize = useDebouncedCallback(
    (id: string, widthPercent: number, heightPercent: number) => {
      if (onResize) {
        onResize(id, widthPercent, heightPercent);
      }
    },
    300
  );

  useEffect(() => {
    setLeft(placedAsset.xPercent * pageWidth);
    setTop(placedAsset.yPercent * pageHeight);
    setCurrentWidth(placedAsset.widthPercent * pageWidth);
    setCurrentHeight(placedAsset.heightPercent * pageHeight);
  }, [
    placedAsset.xPercent,
    placedAsset.yPercent,
    placedAsset.widthPercent,
    placedAsset.heightPercent,
    pageWidth,
    pageHeight,
  ]);

  // Show controls when selected or hovered
  useEffect(() => {
    setShowControls(isSelected);
  }, [isSelected]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || isReadOnly) return;

      const element = ref.current;
      if (!element || !element.parentElement) return;

      const parent = element.parentElement.getBoundingClientRect();
      const moveDistance = e.shiftKey ? 10 : 2;
      let newLeft = left;
      let newTop = top;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (onDelete) {
            onDelete(placedAsset.id);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          newLeft = Math.max(0, left - moveDistance);
          break;

        case "ArrowRight":
          e.preventDefault();
          newLeft = Math.min(parent.width - currentWidth, left + moveDistance);
          break;

        case "ArrowUp":
          e.preventDefault();
          newTop = Math.max(0, top - moveDistance);
          break;

        case "ArrowDown":
          e.preventDefault();
          newTop = Math.min(parent.height - currentHeight, top + moveDistance);
          break;

        default:
          return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        setLeft(newLeft);
        setTop(newTop);
        debouncedUpdate(
          placedAsset.id,
          newLeft / pageWidth,
          newTop / pageHeight
        );
      }
    };

    if (isSelected && !isReadOnly) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    isSelected,
    isReadOnly,
    left,
    top,
    currentWidth,
    currentHeight,
    pageWidth,
    pageHeight,
    placedAsset.id,
    onDelete,
    debouncedUpdate,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReadOnly || isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    start.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSelectedObject(placedAsset.id);
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!element || !element.parentElement) return;
      element.parentElement.style.backgroundColor = "black";
      console.log(element.parentElement)
      const parent = element.parentElement.getBoundingClientRect();
      
      let newLeft = ev.clientX - parent.left - start.current.x;
      let newTop = ev.clientY - parent.top - start.current.y;

      newLeft = Math.max(0, Math.min(newLeft, parent.width - currentWidth));
      newTop = Math.max(0, Math.min(newTop, parent.height - currentHeight));

      setLeft(newLeft);
      setTop(newTop);
      debouncedUpdate(placedAsset.id, newLeft / pageWidth, newTop / pageHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (isReadOnly || !onResize) return;
    e.preventDefault();
    e.stopPropagation();

    const element = ref.current;
    if (!element || !element.parentElement) return;

    setIsResizing(true);
    const parent = element.parentElement.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentWidth;
    const startHeight = currentHeight;
    const startLeft = left;
    const startTop = top;

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // Calculate new dimensions based on direction
      if (direction.includes("right")) {
        newWidth = Math.max(50, startWidth + deltaX);
      }
      if (direction.includes("left")) {
        newWidth = Math.max(50, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(30, startHeight + deltaY);
      }
      if (direction.includes("top")) {
        newHeight = Math.max(30, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      }

      // Maintain aspect ratio for images when shift is held
      if (asset?.type === EditType.IMAGE && e.shiftKey) {
        const aspectRatio = startWidth / startHeight;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
          if (direction.includes("top")) {
            newTop = startTop + (startHeight - newHeight);
          }
        } else {
          newWidth = newHeight * aspectRatio;
          if (direction.includes("left")) {
            newLeft = startLeft + (startWidth - newWidth);
          }
        }
      }

      // Ensure the element stays within bounds
      newLeft = Math.max(0, Math.min(newLeft, parent.width - newWidth));
      newTop = Math.max(0, Math.min(newTop, parent.height - newHeight));
      newWidth = Math.min(newWidth, parent.width - newLeft);
      newHeight = Math.min(newHeight, parent.height - newTop);

      // Update state for real-time visual feedback
      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
      setLeft(newLeft);
      setTop(newTop);

      // Call resize callback with percentages
      debouncedResize(
        placedAsset.id,
        newWidth / pageWidth,
        newHeight / pageHeight
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getObjectContent = () => {
    if (asset?.type === EditType.IMAGE) {
      return (
        <img
          src={asset?.dataUrl}
          alt="Document element"
          className="w-full h-full object-contain"
          draggable={false}
        />
      );
    }

    const commonIconProps = {
      size: 20,
      className: "text-gray-700 mb-1",
    };

    const templates = {
      [EditType.TEMPLATE_DATE]: {
        icon: <Calendar {...commonIconProps} />,
        label: "Date",
        borderColor: "border-slate-300",
        textColor: "text-gray-700",
      },
      [EditType.TEMPLATE_INITIAL]: {
        icon: <Text {...commonIconProps} />,
        label: "Initial",
        borderColor: "border-slate-300",
        textColor: "text-gray-700",
      },
      [EditType.TEMPLATE_SIGN]: {
        icon: <Signature {...commonIconProps} />,
        label: "Signature",
        borderColor: "border-slate-300",
        textColor: "text-gray-700",
      },
    };

    const template = templates[asset?.type as keyof typeof templates];

    return template ? (
      <div
        className={`
        w-full h-full flex flex-col items-center justify-center 
         border-2 border-dashed ${template.borderColor}
      `}
        style={{
          backgroundColor:
            makeColorTransparent(placedAsset.color || "#fffff", 60) || "#fffff",
        }}
      >
        {template.icon}
        <span
          className={`text-xs font-medium ${template.textColor} tracking-wide`}
        >
          {template.label}
        </span>
      </div>
    ) : null;
  };

  if (!placedAsset || !asset) return null;

  const objectWidth = asset.type === EditType.IMAGE ? currentWidth : "20%";
  const objectHeight = asset.type === EditType.IMAGE ? currentHeight : "10%";

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isReadOnly && setShowControls(true)}
      onMouseLeave={() => !isSelected && setShowControls(false)}
      className={`
        absolute group 
        ${isReadOnly ? "" : "cursor-move"}
        ${isDragging ? "scale-[1.02] z-50 shadow-lg" : "z-10"}
        ${isSelected ? "ring-2 ring-blue-500" : ""}
        ${showControls && !isReadOnly ? "hover:ring-1 hover:ring-blue-300" : ""}
        ${isResizing ? "pointer-events-none" : ""}
      `}
      style={{
        left,
        top,
        width: objectWidth,
        height: objectHeight,
      }}
      tabIndex={isSelected ? 0 : -1}
    >
      {/* Main content */}
      <div className="w-full h-full relative overflow-hidden shadow-sm">
        {getObjectContent()}
      </div>

      {/* Professional controls toolbar */}
      {showControls && !isReadOnly && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-md">
          <div className="flex items-center space-x-1">
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-800 transition-all duration-150"
              title="Move element"
            >
              <Move size={12} />
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1"></div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onDelete) {
                  onDelete(placedAsset.id);
                }
              }}
              className="p-1.5 hover:bg-red-50 rounded-md text-gray-600 hover:text-red-600 transition-all duration-150"
              title="Delete element"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced resize handles */}
      {isSelected &&
        !isReadOnly &&
        onResize &&
        asset.type === EditType.IMAGE && (
          <>
            <div
              onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-se-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-sw-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, "top-right")}
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-ne-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, "top-left")}
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-sm cursor-nw-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            />
          </>
        )}

      {/* Professional dragging/resizing state */}
      {(isDragging || isResizing) && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 border border-blue-300 rounded pointer-events-none" />
      )}
    </div>
  );
};
