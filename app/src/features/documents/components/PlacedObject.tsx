import React, { FC, useEffect, useRef, useState } from "react";
import { Calendar, Move, Signature, Text, X } from "lucide-react";
import { Asset, EditType, PlacedObject } from "../types";
import useDebouncedCallback from "../../../hooks/useDebouncedCallback";
import { makeColorTransparent } from "../../../lib/utils";

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
  isSignerPage?: boolean;
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
  isSignerPage = false,
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
  const [currentHeight, setCurrentHeight] = useState<number | null>(
    placedAsset.heightPercent != null
      ? placedAsset.heightPercent * pageHeight
      : null // Allow null as initial state
  );

  const dynamicFontSize = 0.02 * pageWidth;

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
    if (isSelected && ref.current) {
      let parent = ref.current.parentElement;
      let scrollableParent: HTMLElement | null = null;

      while (parent) {
        const { overflowY, overflowX } = window.getComputedStyle(parent);
        if (
          overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowX === "auto" ||
          overflowX === "scroll"
        ) {
          scrollableParent = parent;
          break;
        }
        parent = parent.parentElement;
      }

      if (scrollableParent) {
        const assetRect = ref.current.getBoundingClientRect();
        const parentRect = scrollableParent.getBoundingClientRect();

        const isOutOfViewTop = assetRect.top < parentRect.top;
        const isOutOfViewBottom = assetRect.bottom > parentRect.bottom;
        const isOutOfViewLeft = assetRect.left < parentRect.left;
        const isOutOfViewRight = assetRect.right > parentRect.right;

        if (
          isOutOfViewTop ||
          isOutOfViewBottom ||
          isOutOfViewLeft ||
          isOutOfViewRight
        ) {
          ref.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "start",
          });
        }
      }
    }
  }, [isSelected]);

  useEffect(() => {
    setLeft(placedAsset.xPercent * pageWidth);
    setTop(placedAsset.yPercent * pageHeight);
    setCurrentWidth(placedAsset.widthPercent * pageWidth);
    setCurrentHeight(
      placedAsset.heightPercent != null
        ? placedAsset.heightPercent * pageHeight
        : null
    );
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

      // Use fallback height for boundary checks if currentHeight is null
      const effectiveHeight = currentHeight ?? 50;

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
          newTop = Math.min(parent?.height - effectiveHeight, top + moveDistance);
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
    console.log("Value edittable");

    const element = ref.current;
    if (!element) return;

    setSelectedObject(placedAsset.id);

    if (!isReadOnly) {
      const rect = element.getBoundingClientRect();
      start.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        if (!element || !element.parentElement) return;
        const parent = element.parentElement.getBoundingClientRect();

        let newLeft = ev.clientX - parent.left - start.current.x;
        let newTop = ev.clientY - parent.top - start.current.y;

        // Use fallback height for boundary checks if currentHeight is null
        const effectiveHeight = currentHeight ?? 50;

        newLeft = Math.max(0, Math.min(newLeft, parent.width - currentWidth));
        newTop = Math.max(0, Math.min(newTop, parent.height - effectiveHeight));

        setLeft(newLeft);
        setTop(newTop);
        debouncedUpdate(
          placedAsset.id,
          newLeft / pageWidth,
          newTop / pageHeight
        );
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
    const startHeight = currentHeight ?? 50; // Use fallback if null
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
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(30, startHeight + deltaY);
        // Keep position fixed
      } else if (direction === "bottom-left") {
        newWidth = Math.max(50, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
        newHeight = Math.max(30, startHeight + deltaY);
      } else if (direction === "top-right") {
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(30, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      } else if (direction === "top-left") {
        newWidth = Math.max(50, startWidth - deltaX);
        newLeft = startLeft + (startWidth - newWidth);
        newHeight = Math.max(30, startHeight - deltaY);
        newTop = startTop + (startHeight - newHeight);
      }

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

      if (direction.includes("left") || direction.includes("top")) {
        debouncedUpdate(
          placedAsset.id,
          newLeft / pageWidth,
          newTop / pageHeight
        );
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

  if (!placedAsset || !asset) return null;

  if (isSignerPage && !isValueEdittable && !placedAsset.value) return null;

  const objectWidth = currentWidth;
  const objectHeight = currentHeight ?? ""; // Fallback height for rendering

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isReadOnly && setShowControls(true)}
      onMouseLeave={() => !isSelected && setShowControls(false)}
      className={`
        absolute group border
        ${isValueEdittable ? "cursor-pointer" : isReadOnly ? "" : "cursor-move"}
        ${isDragging ? "z-50" : "z-10"}
        ${isSelected ? "ring-2 ring-blue-500" : ""}
        ${showControls && !isReadOnly ? "hover:ring-1 hover:ring-blue-300" : ""}
        ${isResizing ? "pointer-events-none" : ""}
      `}
      style={{
        left,
        top,
        width: objectWidth,
        height: objectHeight,
        backgroundColor:
          makeColorTransparent(
            placedAsset.color || "#ffffff",
            placedAsset.value && !isValueEdittable ? 0 : 60
          ) || "#ffffff",
        borderColor: placedAsset.value
          ? "transparent"
          : placedAsset.color || "transparent",
      }}
      tabIndex={isSelected ? 0 : -1}
    >
      <div className="w-full h-full relative overflow-hidden shadow-sm">
        {placedAsset.value ? (
          placedAsset.type === EditType.TEMPLATE_SIGN ? (
            <img src={placedAsset.value} alt="" />
          ) : (
            <div style={{ fontSize: dynamicFontSize }}>{placedAsset.value}</div>
          )
        ) : (
          <div className="flex gap-1">
            {placedAsset.type === EditType.TEMPLATE_DATE && (
              <Calendar size={dynamicFontSize} />
            )}
            {placedAsset.type === EditType.TEMPLATE_INITIAL && (
              <Text size={dynamicFontSize} />
            )}
            {placedAsset.type === EditType.TEMPLATE_SIGN && (
              <Signature size={dynamicFontSize} />
            )}

            <span
              className="font-medium text-gray-700 tracking-wide"
              style={{ fontSize: dynamicFontSize }}
            >
              {placedAsset.type === EditType.TEMPLATE_DATE && "Date"}
              {placedAsset.type === EditType.TEMPLATE_INITIAL && "Initial"}
              {placedAsset.type === EditType.TEMPLATE_SIGN && "Signature"}
            </span>
          </div>
        )}
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
            className="absolute -bottom-1 -right-1 w-[8px] h-[8px] border border-blue-600 rounded-full cursor-se-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            style={{ backgroundColor: placedAsset.color }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
            className="absolute -bottom-1 -left-1 w-[8px] h-[8px] border border-blue-600 rounded-full cursor-sw-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            style={{ backgroundColor: placedAsset.color }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "top-right")}
            className="absolute -top-1 -right-1 w-[8px] h-[8px] border border-blue-600 rounded-full cursor-ne-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            style={{ backgroundColor: placedAsset.color }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "top-left")}
            className="absolute -top-1 -left-1 w-[8px] h-[8px] border border-blue-600 rounded-full cursor-nw-resize hover:bg-blue-700 transition-colors shadow-sm pointer-events-auto z-10"
            style={{ backgroundColor: placedAsset.color }}
          />
        </>
      )}

      {(isDragging || isResizing) && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 border border-blue-300 rounded pointer-events-none" />
      )}
    </div>
  );
};