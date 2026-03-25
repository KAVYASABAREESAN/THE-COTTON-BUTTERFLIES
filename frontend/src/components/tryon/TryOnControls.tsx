import React from 'react';
import { Camera, Sparkles, X } from 'lucide-react';

type TryOnControlsProps = {
  selectedImage: string;
  imageOptions: string[];
  scale: number;
  mirror: boolean;
  cameraAvailable: boolean;
  itemLabel: string;
  helperText: string;
  onImageChange: (image: string) => void;
  onScaleChange: (value: number) => void;
  onMirrorToggle: () => void;
  onCapture: () => void;
  onClose: () => void;
};

const TryOnControls: React.FC<TryOnControlsProps> = ({
  selectedImage,
  imageOptions,
  scale,
  mirror,
  cameraAvailable,
  itemLabel,
  helperText,
  onImageChange,
  onScaleChange,
  onMirrorToggle,
  onCapture,
  onClose
}) => {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Virtual Try-On</p>
          <h3 className="mt-1 text-xl font-medium text-gray-900">Accessory Preview</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close try-on"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Choose {itemLabel}</label>
          <div className="grid grid-cols-2 gap-3">
            {imageOptions.map((image, index) => {
              const active = image === selectedImage;
              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => onImageChange(image)}
                  className={`overflow-hidden rounded-xl border p-1 transition ${
                    active ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                    <img src={image} alt={`${itemLabel} ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                  <span className="block px-2 py-2 text-xs font-medium text-gray-700">
                    Option {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Scale</label>
            <span className="text-xs font-medium text-gray-500">{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={scale}
            onChange={(event) => onScaleChange(Number(event.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <button
          type="button"
          onClick={onMirrorToggle}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          Mirror Mode: {mirror ? 'On' : 'Off'}
        </button>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          onClick={onCapture}
          disabled={!cameraAvailable}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
        >
          <Camera size={18} />
          Capture Look
        </button>
        <div
          className={`rounded-xl px-4 py-3 text-xs ${
            cameraAvailable ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Sparkles size={14} />
            {cameraAvailable ? 'Live face tracking is active.' : 'Camera preview is unavailable.'}
          </div>
          <p className="mt-1">
            {cameraAvailable
              ? helperText
              : 'Allow camera access and close any app or tab already using the webcam, then try again.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TryOnControls;
