import React, { FC, useEffect, useRef, useState } from "react";
import { Move, X } from "lucide-react";
import { Asset, EditType, PlacedObject } from "../types";
import useDebouncedCallback from "../../../hooks/useDebouncedCallback";
import { makeColorTransparent } from "../../../lib/utils";
import TEM_Date from "./TEM_Date";
import TEM_Initial from "./TEM_Initial";
import TEM_Sign from "./TEM_Sign";

interface PlacedImageProps {
  placedAsset: PlacedObject;
  asset: Asset | undefined;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
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
  isValueEdittable?: boolean;
  showValue?: boolean;
}

export const PlacedObjectComponent: React.FC<PlacedImageProps> = ({
  placedAsset,
  asset,
  containerRef,
  pageWidth,
  pageHeight,
  isSelected,
  setSelectedObject,
  updateObjectPosition,
  onDelete,
  onResize,
  isReadOnly = false,
  isValueEdittable = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const [left, setLeft] = useState(placedAsset.xPercent * pageWidth);
  const [top, setTop] = useState(placedAsset.yPercent * pageHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const [currentWidth, setCurrentWidth] = useState(
    placedAsset.widthPercent * pageWidth
  );
  const [currentHeight, setCurrentHeight] = useState(
    placedAsset.heightPercent * pageHeight
  );

  const debouncedUpdate = useDebouncedCallback(updateObjectPosition, 300);
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

  useEffect(() => {
    setShowControls(isSelected);
  }, [isSelected]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || isReadOnly) return;

      const element = ref.current;
      const container = containerRef.current;
      if (!element || !container) return;

      const parent = container.getBoundingClientRect();
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
          newLeft = Math.min(parent?.width - currentWidth, left + moveDistance);
          break;

        case "ArrowUp":
          e.preventDefault();
          newTop = Math.max(0, top - moveDistance);
          break;

        case "ArrowDown":
          e.preventDefault();
          newTop = Math.min(parent?.height - currentHeight, top + moveDistance);
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
    console.log("handleMouseDown triggered for ID:", placedAsset.id);
    if (isReadOnly && !isValueEdittable) return;
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    const element = ref.current;
    if (!element) return;

    setSelectedObject(placedAsset.id);

    if (!isReadOnly) {
      const rect = element.getBoundingClientRect();
      start.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        if (!element || !element.parentElement) return;
        element.parentElement.style.backgroundColor = "black";

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
    }
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

      if (direction === "bottom-right") {
        // Only update width and height, keep position fixed
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(30, startHeight + deltaY);
      } else {
        // Handle other directions as before
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
      }

      if (asset?.type === EditType.IMAGE && e.shiftKey) {
        const aspectRatio = startWidth / startHeight;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
          if (direction.includes("top") && direction !== "bottom-right") {
            newTop = startTop + (startHeight - newHeight);
          }
        } else {
          newWidth = newHeight * aspectRatio;
          if (direction.includes("left") && direction !== "bottom-right") {
            newLeft = startLeft + (startWidth - newWidth);
          }
        }
      }

      newLeft = Math.max(0, Math.min(newLeft, parent.width - newWidth));
      newTop = Math.max(0, Math.min(newTop, parent.height - newHeight));
      newWidth = Math.min(newWidth, parent.width - newLeft);
      newHeight = Math.min(newHeight, parent.height - newTop);

      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
      setLeft(newLeft);
      setTop(newTop);

      debouncedResize(
        placedAsset.id,
        newWidth / pageWidth,
        newHeight / pageHeight
      );

      // Update position only if not bottom-right resizing
      if (direction !== "bottom-right") {
        debouncedUpdate(placedAsset.id, newLeft / pageWidth, newTop / pageHeight);
      }
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

    switch (asset?.type) {
      case EditType.TEMPLATE_DATE:
        return (
          <TEM_Date
            placedAsset={placedAsset}
            isValueEdittable={isValueEdittable}
          />
        );

      case EditType.TEMPLATE_INITIAL:
        return (
          <TEM_Initial
            placedAsset={placedAsset}
            isValueEdittable={isValueEdittable}
          />
        );

      case EditType.TEMPLATE_SIGN:
        return (
          <TEM_Sign
            placedAsset={placedAsset}
            isValueEdittable={isValueEdittable}
          />
        );

      default:
        return null;
    }
  };

  if (!placedAsset || !asset) return null;

  const objectWidth = currentWidth;
  const objectHeight = currentHeight;

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isReadOnly && setShowControls(true)}
      onMouseLeave={() => !isSelected && setShowControls(false)}
      className={`
        absolute group 
        ${isValueEdittable && isReadOnly ? "cursor-pointer" : "cursor-move"}
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
      <div className="w-full h-full relative overflow-hidden shadow-sm">
        {getObjectContent()}
      </div>

      {showControls && !isReadOnly && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-md">
          <div className="flex items-center space-x-1">
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-800 transition-all duration-150"
              title="Move element"
            >
              <Move size={12} />
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1"></div>

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

      {isSelected && !isReadOnly && (
        <>
          <div
            onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize hover:bg-blue-700 transition-colors shadow-md pointer-events-auto z-20 group/resize"
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover/resize:opacity-100 transition-opacity duration-150 pointer-events-none">
              Resize
            </div>
          </div>
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

      {(isDragging || isResizing) && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 border border-blue-300 rounded pointer-events-none" />
      )}
    </div>
  );
};