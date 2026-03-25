import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    FaceMesh?: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: FaceMeshResults) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close?: () => void;
    };
    Camera?: new (
      video: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      }
    ) => {
      start: () => Promise<void>;
      stop?: () => void;
    };
    drawLandmarks?: (
      canvasCtx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmark[],
      options?: Record<string, unknown>
    ) => void;
  }
}

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

type FaceMeshResults = {
  multiFaceLandmarks?: NormalizedLandmark[][];
};

type JewelryOption = {
  id: string;
  label: string;
  src: string;
};

const NECKLACE_OPTIONS: JewelryOption[] = [
  { id: 'necklace1', label: 'Monika Set', src: '/jewelry/necklaces/necklace1.png' }
];

const SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
];

const ensureScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;

    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });

const JewelryTryOn: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<InstanceType<NonNullable<typeof window.FaceMesh>> | null>(null);
  const cameraRef = useRef<InstanceType<NonNullable<typeof window.Camera>> | null>(null);
  const necklaceImageRef = useRef<HTMLImageElement | null>(null);

  const [selectedNecklace, setSelectedNecklace] = useState(NECKLACE_OPTIONS[0]);
  const [status, setStatus] = useState('Starting webcam and face tracking...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const initializeTryOn = async () => {
      try {
        setError(null);
        setStatus('Loading MediaPipe assets...');

        await Promise.all(SCRIPT_URLS.map(ensureScript));
        const necklaceImage = await loadImage(selectedNecklace.src);

        if (isCancelled) {
          return;
        }

        necklaceImageRef.current = necklaceImage;

        if (!window.FaceMesh || !window.Camera || !videoRef.current) {
          throw new Error('MediaPipe scripts are not available in the browser.');
        }

        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        faceMesh.onResults((results: FaceMeshResults) => {
          drawResults(results);
        });

        faceMeshRef.current = faceMesh;

        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 960,
          height: 720
        });

        cameraRef.current = camera;
        setStatus('Starting webcam...');
        await camera.start();

        if (!isCancelled) {
          setStatus('Live tracking active. Move your face to see the jewelry follow.');
        }
      } catch (initError: any) {
        console.error('[JewelryTryOn] initializeTryOn:error', initError);
        if (!isCancelled) {
          setError(initError.message || 'Failed to initialize virtual try-on.');
          setStatus('Virtual try-on unavailable.');
        }
      }
    };

    initializeTryOn();

    return () => {
      isCancelled = true;
      cameraRef.current?.stop?.();
      faceMeshRef.current?.close?.();
    };
  }, []);

  useEffect(() => {
    loadImage(selectedNecklace.src)
      .then((image) => {
        necklaceImageRef.current = image;
        setError(null);
      })
      .catch((imageError) => {
        console.error('[JewelryTryOn] necklaceImage:error', imageError);
        setError(`Could not load ${selectedNecklace.label}.`);
      });
  }, [selectedNecklace]);

  const drawAccessory = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | null,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) => {
    if (!image) {
      return;
    }

    ctx.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
  };

  const drawResults = (results: FaceMeshResults) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = video.videoWidth || 960;
    const height = video.videoHeight || 720;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    const landmarks = results.multiFaceLandmarks?.[0];
    if (!landmarks) {
      setStatus('Face not detected. Center your face in the frame.');
      return;
    }

    setStatus('Tracking face. Jewelry is following your movement.');

    const toPoint = (index: number) => ({
      x: landmarks[index].x * width,
      y: landmarks[index].y * height
    });

    // Chin placement uses landmark 152, the center-bottom point of the chin.
    // The necklace is drawn below this point to simulate resting on the neck.
    const chin = toPoint(152);
    const jawLeft = toPoint(234);
    const jawRight = toPoint(454);

    const faceWidth = Math.abs(jawRight.x - jawLeft.x);
    const necklaceWidth = Math.max(faceWidth * 1.15, 220);
    const necklaceHeight = necklaceWidth * 0.75;

    drawAccessory(ctx, necklaceImageRef.current, chin.x, chin.y + necklaceHeight * 0.38, necklaceWidth, necklaceHeight);

    if (window.drawLandmarks) {
      window.drawLandmarks(ctx, [landmarks[234], landmarks[454], landmarks[152]], {
        color: '#f43f5e',
        fillColor: '#f43f5e',
        radius: 2
      });
    }
  };

  return (
    <div className="w-full max-w-5xl rounded-[2rem] border border-rose-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(190,24,93,0.12)] backdrop-blur">
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-serif font-light text-stone-900">Real-Time Jewelry Try-On</h2>
        <p className="mt-2 text-sm text-stone-600">{status}</p>
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      </div>

      <div className="mx-auto overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-950 shadow-inner">
        <div className="relative aspect-[4/3] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-3xl bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Necklace Try-On</p>
          <p className="mb-3 text-sm text-stone-600">Loaded set: {selectedNecklace.label}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {NECKLACE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedNecklace(option)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selectedNecklace.id === option.id
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-white text-stone-700 shadow-sm hover:bg-amber-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelryTryOn;
