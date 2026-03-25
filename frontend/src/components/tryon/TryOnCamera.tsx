import React, { useEffect, useRef, useState } from 'react';
import { showErrorToast } from '../../utils/toast';

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

type TryOnCameraProps = {
  selectedImage: string;
  scale: number;
  mode: 'earrings' | 'chains';
  mirror: boolean;
  onReady?: () => void;
  onAvailabilityChange?: (available: boolean) => void;
};

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

const removeSimpleBackground = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return image;
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;

    if (brightness > 240) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const processed = new Image();
  processed.src = canvas.toDataURL('image/png');
  return processed;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(removeSimpleBackground(image));
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });

const loadAccessoryImage = async (src: string, mode: 'earrings' | 'chains') => {
  if (mode !== 'earrings') {
    return loadImage(src);
  }

  const normalizedSrc = src.replace('/jewelry/', '/jewellery/');
  const fallbackSrc = src.replace('/jewellery/', '/jewelry/');

  try {
    return await loadImage(normalizedSrc);
  } catch (primaryError) {
    if (fallbackSrc !== normalizedSrc) {
      try {
        return await loadImage(fallbackSrc);
      } catch {
        throw primaryError;
      }
    }

    throw primaryError;
  }
};

const stopMediaStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const TryOnCamera: React.FC<TryOnCameraProps> = ({
  selectedImage,
  scale,
  mode,
  mirror,
  onReady,
  onAvailabilityChange
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<InstanceType<NonNullable<typeof window.FaceMesh>> | null>(null);
  const accessoryImageRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [status, setStatus] = useState('Starting camera...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      setError('No accessory image available for try-on.');
      onAvailabilityChange?.(false);
      return;
    }

    let cancelled = false;
    let localStream: MediaStream | null = null;

    const initialize = async () => {
      try {
        setError(null);
        onAvailabilityChange?.(false);
        setStatus('Loading try-on engine...');
        await Promise.all(SCRIPT_URLS.map(ensureScript));
        accessoryImageRef.current = await loadAccessoryImage(selectedImage, mode);

        if (cancelled) {
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support webcam access.');
        }

        if (!window.FaceMesh || !videoRef.current) {
          throw new Error('MediaPipe failed to load.');
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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 720 }
          }
        });

        if (cancelled) {
          stopMediaStream(stream);
          return;
        }

        localStream = stream;
        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (cancelled) {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          stopMediaStream(stream);
          return;
        }

        const processFrame = async () => {
          if (!videoRef.current || !faceMeshRef.current || cancelled) {
            return;
          }

          if (videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }

          animationFrameRef.current = window.requestAnimationFrame(() => {
            processFrame().catch((frameError) => {
              console.error('[TryOnCamera] frame:error', frameError);
            });
          });
        };

        await processFrame();
        setStatus('Camera ready. Move your face naturally.');
        onAvailabilityChange?.(true);
        onReady?.();
      } catch (cameraError: any) {
        console.error('[TryOnCamera] initialize:error', cameraError);
        if (!cancelled) {
          const friendlyMessage =
            cameraError?.name === 'NotFoundError' || cameraError?.name === 'DevicesNotFoundError'
              ? 'No camera was found. Connect or enable a webcam and try again.'
              : cameraError?.name === 'NotAllowedError'
                ? 'Camera access was blocked. Please allow camera permission and try again.'
                : cameraError?.name === 'NotReadableError' || cameraError?.name === 'AbortError'
                  ? 'The camera is busy or could not be started. Close other apps or tabs using the camera and try again.'
                : cameraError?.message || 'Unable to start the try-on camera.';
          setError(friendlyMessage);
          setStatus('Try-on unavailable.');
          onAvailabilityChange?.(false);
          showErrorToast(cameraError, friendlyMessage);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      faceMeshRef.current?.close?.();
      faceMeshRef.current = null;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      stopMediaStream(localStream);
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, [mode, onAvailabilityChange, onReady, selectedImage]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    loadAccessoryImage(selectedImage, mode)
      .then((image) => {
        accessoryImageRef.current = image;
      })
      .catch((imageError) => {
        console.error('[TryOnCamera] selectedImage:error', imageError);
        setError('Unable to process the selected jewellery image.');
        onAvailabilityChange?.(false);
        showErrorToast(imageError, 'Unable to process the selected jewellery image.');
      });
  }, [mode, onAvailabilityChange, selectedImage]);

  const drawImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | null,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    rotation: number
  ) => {
    if (!image) {
      return;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
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
      setStatus('Face not detected. Center your face in frame.');
      return;
    }

    setStatus('Live tracking active.');

    const point = (index: number) => ({
      x: landmarks[index].x * width,
      y: landmarks[index].y * height
    });

    // 234 and 454 sit along the left and right side of the face and work well as ear anchors.
    const leftAnchor = point(234);
    const rightAnchor = point(454);

    // 152 is the chin landmark; placing the necklace slightly below it aligns with the neck area.
    const chin = point(152);
    const faceWidth = Math.abs(rightAnchor.x - leftAnchor.x);
    const headTilt = Math.atan2(rightAnchor.y - leftAnchor.y, rightAnchor.x - leftAnchor.x);

    if (mode === 'earrings') {
      const earringWidth = Math.max(faceWidth * 0.12 * scale, 32);
      const earringHeight = earringWidth * 1.7;
      const horizontalOffset = faceWidth * 0.03;
      const leftEarlobeX = leftAnchor.x - horizontalOffset;
      const leftEarlobeY = leftAnchor.y + faceWidth * 0.12;
      const rightEarlobeX = rightAnchor.x + horizontalOffset;
      const rightEarlobeY = rightAnchor.y + faceWidth * 0.12;
      // Landmark 234 anchors the left ear and 454 anchors the right ear.
      // The earlobe position is estimated slightly inward and lower than the side-of-face landmarks.
      drawImage(
        ctx,
        accessoryImageRef.current,
        leftEarlobeX,
        leftEarlobeY + earringHeight / 2,
        earringWidth,
        earringHeight,
        headTilt
      );
      drawImage(
        ctx,
        accessoryImageRef.current,
        rightEarlobeX,
        rightEarlobeY + earringHeight / 2,
        earringWidth,
        earringHeight,
        headTilt
      );
    } else {
      const necklaceWidth = Math.max(faceWidth * 1.12 * scale, 220);
      const necklaceHeight = necklaceWidth * 0.72;
      drawImage(
        ctx,
        accessoryImageRef.current,
        chin.x,
        chin.y + necklaceHeight * 0.34,
        necklaceWidth,
        necklaceHeight,
        headTilt * 0.35
      );
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-950 p-3 shadow-inner">
      <div className="relative overflow-hidden rounded-[1.25rem]">
        <div className="relative aspect-[4/3] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: mirror ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ transform: mirror ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
        <span>{status}</span>
        {error && <span className="font-medium text-red-300">{error}</span>}
      </div>
    </div>
  );
};

export default TryOnCamera;
