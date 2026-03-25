import React, { useMemo, useRef, useState } from 'react';
import ChainTryOn from './ChainTryOn';
import EarringTryOn from './EarringTryOn';
import TryOnControls from './TryOnControls';

type TryOnModalProps = {
  isOpen: boolean;
  productName: string;
  productImages: string[];
  subcategory?: string;
  productCategory?: string;
  onClose: () => void;
};

const TryOnModal: React.FC<TryOnModalProps> = ({
  isOpen,
  productName,
  productImages,
  subcategory,
  productCategory,
  onClose
}) => {
  const [selectedImage, setSelectedImage] = useState(productImages[0] || '');
  const [scale, setScale] = useState(1);
  const [mirror, setMirror] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const captureTargetRef = useRef<HTMLDivElement | null>(null);
  const normalizedCategory = productCategory?.toLowerCase() || '';
  const mode =
    normalizedCategory === 'accessories'
      ? subcategory === 'earrings'
        ? 'earrings'
        : 'chains'
      : 'chains';

  const validImages = useMemo(() => {
    return productImages.filter(
      (image) => image && !image.startsWith('blob:') && !image.includes('/api/placeholder')
    );
  }, [productImages]);

  React.useEffect(() => {
    if (validImages.length > 0) {
      setSelectedImage(validImages[0]);
    }
  }, [validImages]);

  React.useEffect(() => {
    setCameraAvailable(false);
  }, [selectedImage, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleCapture = () => {
    const container = captureTargetRef.current;
    if (!container) {
      return;
    }

    const video = container.querySelector('video');
    const canvas = container.querySelector('canvas');

    if (!(video instanceof HTMLVideoElement) || !(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) {
      return;
    }

    if (mirror) {
      exportCtx.translate(exportCanvas.width, 0);
      exportCtx.scale(-1, 1);
    }

    exportCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-try-on.png`;
    link.click();
  };

  const selectedImageIndex = Math.max(validImages.indexOf(selectedImage), 0);
  const resolvedTryOnImage =
    mode === 'earrings'
      ? `/jewellery/earrings/earring${selectedImageIndex + 1}.png`
      : selectedImage;
  const selectedTryOnImage = resolvedTryOnImage;
  const itemLabel = 'Jewellery';
  const helperText = 'Move naturally and the accessory overlay will follow your face in real time.';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[95vh] w-full max-w-6xl overflow-auto rounded-[2rem] bg-[#fcfbf8] p-4 shadow-2xl sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Try On</p>
          <h2 className="mt-2 text-3xl font-serif font-light text-gray-900">{productName}</h2>
        </div>

        {validImages.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No valid accessory images are available for try-on.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_360px]">
            <div ref={captureTargetRef}>
              {mode === 'earrings' ? (
                <EarringTryOn
                  selectedImage={selectedTryOnImage}
                  scale={scale}
                  mirror={mirror}
                  onAvailabilityChange={setCameraAvailable}
                />
              ) : (
                <ChainTryOn
                  selectedImage={selectedImage}
                  scale={scale}
                  mirror={mirror}
                  onAvailabilityChange={setCameraAvailable}
                />
              )}
            </div>

            <TryOnControls
              selectedImage={selectedImage}
              imageOptions={validImages}
              scale={scale}
              mirror={mirror}
              cameraAvailable={cameraAvailable}
              itemLabel={itemLabel}
              helperText={helperText}
              onImageChange={setSelectedImage}
              onScaleChange={setScale}
              onMirrorToggle={() => setMirror((prev) => !prev)}
              onCapture={handleCapture}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOnModal;
