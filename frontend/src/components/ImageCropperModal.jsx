import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Crop, ZoomIn, ZoomOut, Loader2, Move, Sparkles } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx || !pixelCrop) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 0.95);
  });
}

export default function ImageCropperModal({ 
  imageSrc, 
  aspectRatio = null, 
  onCropComplete, 
  onCancel,
  title
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState(null);
  const [currentAspect, setCurrentAspect] = useState(aspectRatio);

  const isFixedRatio = typeof aspectRatio === 'number' && aspectRatio > 0;

  useEffect(() => {
    const isAlreadyLocked = document.body.style.overflow === 'hidden';
    if (!isAlreadyLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, []);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onMediaLoaded = (mediaSize) => {
    if (mediaSize.naturalWidth && mediaSize.naturalHeight) {
      const ratio = mediaSize.naturalWidth / mediaSize.naturalHeight;
      setNaturalAspect(ratio);
      if (!isFixedRatio) {
        setCurrentAspect(ratio);
      }
    }
  };

  const handleUseOriginal = async () => {
    setSaving(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      blob.name = 'original_image.jpg';
      onCropComplete(blob);
    } catch (e) {
      console.error('Failed to get original image blob, falling back to canvas:', e);
      try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((file) => {
          file.name = 'original_image.jpg';
          onCropComplete(file);
        }, 'image/jpeg', 0.95);
      } catch (err2) {
        console.error('Fallback canvas failed:', err2);
        onCancel();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBlob) {
        croppedImageBlob.name = 'cropped_image.jpg';
        onCropComplete(croppedImageBlob);
      }
    } catch (e) {
      console.error(e);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  const aspectPresets = [
    { id: 'original', label: 'Original', value: naturalAspect },
    { id: '16-9', label: '16:9 Banner', value: 16 / 9 },
    { id: '4-3', label: '4:3 Standard', value: 4 / 3 },
    { id: '1-1', label: '1:1 Square', value: 1 },
    { id: '3-4', label: '3:4 Portrait', value: 3 / 4 },
    { id: '9-16', label: '9:16 Flyer', value: 9 / 16 },
  ];

  const modalTitle = title || (
    isFixedRatio
      ? (aspectRatio === 1 ? 'Crop Profile Picture' : 'Crop Image Asset')
      : 'Adjust Event Poster / Banner'
  );

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 overscroll-contain"
      onClick={onCancel}
    >
      <div 
        className="bg-background-100 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-400 flex flex-col overflow-hidden text-gray-1000 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-400 bg-background-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shrink-0 shadow-2xs text-gray-1000">
              <Crop className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">{modalTitle}</h2>
              <p className="text-[11px] text-gray-700 font-sans mt-0.5">
                {!isFixedRatio 
                  ? 'Pick any aspect ratio or use full image without cropping' 
                  : 'Drag to reposition, use slider to zoom'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Aspect Ratio Selector (Only when aspect ratio is not strictly locked) */}
          {!isFixedRatio && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-gray-700">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Framing Aspect Ratio</span>
                <span className="text-[10px] text-teal-700 font-medium">No rigid aspect compulsion</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {aspectPresets.map((preset) => {
                  if (!preset.value) return null;
                  const isSelected = currentAspect && Math.abs(currentAspect - preset.value) < 0.02;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCurrentAspect(preset.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-gray-1000 text-background-100 border-gray-1000 font-semibold shadow-2xs'
                          : 'bg-background-200 text-gray-800 border-gray-400 hover:border-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cropper Viewport Frame */}
          <div className="relative w-full h-64 sm:h-72 bg-black/95 rounded-xl overflow-hidden border border-gray-400 shadow-inner">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={currentAspect || 1}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onMediaLoaded={onMediaLoaded}
            />
          </div>

          {/* Zoom Control Slider */}
          <div className="p-3 rounded-xl bg-background-200 border border-gray-400 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-700">
              <span className="font-medium flex items-center gap-1.5">
                <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
                <span>Zoom Scale</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-background-100 border border-gray-400 text-[11px] font-bold text-gray-900">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-gray-500 shrink-0" />
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.05} 
                aria-label="Zoom Scale" 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full accent-gray-1000 cursor-pointer h-1.5 rounded-lg bg-gray-300 dark:bg-gray-700" 
              />
              <ZoomIn className="w-4 h-4 text-gray-500 shrink-0" />
            </div>
          </div>

          <p className="text-[11px] text-gray-600 font-sans text-center flex items-center justify-center gap-1.5">
            <Move className="w-3 h-3 text-gray-500" />
            <span>Drag image to reposition framing</span>
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-background-200 border-t border-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider hidden sm:inline-block">
            {isFixedRatio ? `${aspectRatio}:1 Fixed Aspect` : 'Flexible Poster Dimensions'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button 
              type="button"
              onClick={onCancel} 
              className="px-3.5 py-2 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isFixedRatio && (
              <button
                type="button"
                onClick={handleUseOriginal}
                disabled={saving}
                className="px-3.5 py-2 rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-xs font-medium transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                title="Skip crop and upload complete original poster"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Use Full Image (No Crop)</span>
              </button>
            )}

            <button 
              type="button"
              onClick={handleSave} 
              disabled={saving}
              className="px-4 py-2 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
              <span>{saving ? 'Saving...' : (isFixedRatio && aspectRatio === 1 ? 'Apply Picture' : 'Apply Crop')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
