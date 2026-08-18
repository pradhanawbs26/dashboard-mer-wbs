import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, Crop } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when a new image is loaded or opened
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });

      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Pointer drag handlers for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCrop = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const OUTPUT_SIZE = 400; // standard crisp 400x400 output
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport diameter is 240px inside container
    const VIEWPORT_DIAMETER = 240;

    // Base scale to fit inside 240px
    const baseScale = Math.max(VIEWPORT_DIAMETER / img.width, VIEWPORT_DIAMETER / img.height);
    const effectiveScale = baseScale * zoom;

    // Ratio from display viewport (240px) to output canvas (400px)
    const renderScale = OUTPUT_SIZE / VIEWPORT_DIAMETER;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Move to center of output canvas
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // Apply offset scaled to output canvas
    ctx.translate(offset.x * renderScale, offset.y * renderScale);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw image centered
    const drawWidth = img.width * effectiveScale * renderScale;
    const drawHeight = img.height * effectiveScale * renderScale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedBase64);
    onClose();
  }, [offset, rotation, zoom, onCropComplete, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/40 text-slate-800 space-y-0 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crop className="w-4 h-4 text-blue-400" />
            <h3 className="font-headline-md font-extrabold text-sm sm:text-base text-white">
              Sesuaikan & Potong Foto Profil (Crop)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Canvas Container */}
        <div className="p-4 sm:p-5 flex flex-col items-center bg-slate-100/60">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-64 h-64 sm:w-72 sm:h-72 bg-slate-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner flex items-center justify-center touch-none"
          >
            {/* The Image being transformed */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  position: 'absolute',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              />
            )}

            {/* Circular Mask & Target Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Circular viewport border with grid */}
              <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] relative overflow-hidden">
                {/* 3x3 Grid Guides */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
              <span className="text-[10px] bg-slate-900/80 text-blue-200 px-2 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                Geser gambar untuk menyesuaikan posisi
              </span>
            </div>
          </div>

          {/* Controls Bar: Zoom, Rotate, Reset */}
          <div className="w-full mt-4 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
                className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs font-bold text-slate-700 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotation & Reset Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Putar 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Reset Posisi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Potong & Terapkan Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
