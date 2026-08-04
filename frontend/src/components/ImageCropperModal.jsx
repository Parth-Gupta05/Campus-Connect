import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck } from 'react-icons/fi';

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

  if (!ctx) {
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
    }, 'image/jpeg');
  });
}

export default function ImageCropperModal({ imageSrc, aspectRatio = 1, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Give it a default filename for file inputs that require it
      croppedImageBlob.name = 'cropped_image.jpg';
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col justify-center items-center backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl text-center mb-6">
        <h3 className="text-white text-headline-sm font-bold">Crop Image</h3>
        <p className="text-white/70 text-sm">Drag to reposition, use slider to zoom</p>
      </div>

      <div className="relative w-full max-w-2xl h-[50vh] md:h-[60vh] bg-black border border-border-light rounded-2xl overflow-hidden shadow-2xl">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
        />
      </div>

      <div className="mt-6 flex items-center gap-4 bg-surface p-4 rounded-xl border border-border-light shadow-ambient w-full max-w-sm">
        <span className="text-sm font-bold text-on-surface-variant">Zoom</span>
        <input 
          type="range" 
          value={zoom} 
          min={1} 
          max={3} 
          step={0.1} 
          aria-labelledby="Zoom" 
          onChange={(e) => setZoom(e.target.value)} 
          className="w-full accent-primary cursor-pointer" 
        />
      </div>

      <div className="flex gap-4 mt-8 w-full max-w-sm">
        <button onClick={onCancel} className="flex-1 px-6 py-3 bg-surface-variant text-on-surface-variant rounded-full font-bold hover:bg-outline-variant flex justify-center items-center gap-2">
          <FiX /> Cancel
        </button>
        <button onClick={handleSave} className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:bg-primary-container flex justify-center items-center gap-2">
          <FiCheck /> Save Crop
        </button>
      </div>
    </div>
  );
}
