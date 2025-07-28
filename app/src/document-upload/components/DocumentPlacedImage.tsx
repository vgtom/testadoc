import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import { useEffect, useRef, useState } from "react";
import { Asset, PlacedImage } from "../DocumentEditor";

interface PlacedImageProps {
  image: PlacedImage;
  assets: Asset[];
  width: number;
  pageHeight: number;
  selectedImage: string | null;
  setSelectedImage: (id: string | null) => void;
  updateImagePosition: (id: string, xPercent: number, yPercent: number) => void;
}

export const PlacedImageComponent: React.FC<PlacedImageProps> = ({
  image,
  assets,
  width,
  pageHeight,
  selectedImage,
  setSelectedImage,
  updateImagePosition,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef({ x: 0, y: 0 });
  const [left, setLeft] = useState(image.xPercent * width);
  const [top, setTop] = useState(image.yPercent * pageHeight);

  const asset = assets.find((a) => a.id === image.assetId);
  const debouncedUpdate = useDebouncedCallback(updateImagePosition, 500);

  useEffect(() => {
    setLeft(image.xPercent * width);
    setTop(image.yPercent * pageHeight);
  }, [image.xPercent, image.yPercent, width, pageHeight]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    start.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSelectedImage(image.id);

    const onMouseMove = (ev: MouseEvent) => {
      if (!element || !element.parentElement) return;
      const parent = element.parentElement.getBoundingClientRect();
      let newLeft = ev.clientX - parent.left - start.current.x;
      let newTop = ev.clientY - parent.top - start.current.y;

      newLeft = Math.max(0, Math.min(newLeft, parent.width - element.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, parent.height - element.offsetHeight));

      setLeft(newLeft);
      setTop(newTop);
      debouncedUpdate(image.id, newLeft / width, newTop / pageHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setSelectedImage(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  if (!asset) return null;

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      className={`absolute cursor-move border-2 rounded select-none transition-all duration-100 ${
        selectedImage === image.id ? "border-blue-500 shadow-md" : "border-transparent hover:border-blue-300"
      }`}
      style={{
        left,
        top,
        width: image.widthPercent * width,
        height: image.heightPercent * pageHeight,
        zIndex: 10,
      }}
    >
      <img
        src={asset.dataUrl}
        alt="Placed"
        className="w-full h-full object-contain rounded"
        draggable={false}
      />
    </div>
  );
};