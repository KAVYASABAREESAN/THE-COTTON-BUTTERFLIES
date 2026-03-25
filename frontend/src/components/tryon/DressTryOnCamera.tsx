import React, { useEffect, useRef, useState } from 'react';
import { showErrorToast } from '../../utils/toast';

declare global {
  interface Window {
    Pose?: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: PoseResults) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close?: () => void;
    };
  }
}

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

type PoseResults = {
  poseLandmarks?: NormalizedLandmark[];
};

type BodyFrameMetrics = {
  upperChest: { x: number; y: number };
  shoulderCenter: { x: number; y: number };
  hipCenter: { x: number; y: number };
  bodyCenter: { x: number; y: number };
  shoulderWidth: number;
  torsoHeight: number;
  garmentHeight: number;
  rotation: number;
};

type DressTryOnCameraProps = {
  selectedImage: string;
  garmentType?: string;
  scale: number;
  mirror: boolean;
  onAvailabilityChange?: (available: boolean) => void;
};

const SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
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

  const samplePoints = [
    [0, 0],
    [canvas.width - 1, 0],
    [0, canvas.height - 1],
    [canvas.width - 1, canvas.height - 1]
  ] as const;
  const cornerAverage = samplePoints.reduce(
    (acc, [x, y]) => {
      const offset = (y * canvas.width + x) * 4;
      acc.r += data[offset];
      acc.g += data[offset + 1];
      acc.b += data[offset + 2];
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );
  const backgroundColor = {
    r: cornerAverage.r / samplePoints.length,
    g: cornerAverage.g / samplePoints.length,
    b: cornerAverage.b / samplePoints.length
  };

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const colorDistance = Math.sqrt(
      (data[i] - backgroundColor.r) ** 2 +
      (data[i + 1] - backgroundColor.g) ** 2 +
      (data[i + 2] - backgroundColor.b) ** 2
    );

    if (brightness > 240 || colorDistance < 42) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const trimmed = trimTransparentBounds(canvas);
  const processed = new Image();
  processed.src = trimmed.toDataURL('image/png');
  return processed;
};

const trimTransparentBounds = (sourceCanvas: HTMLCanvasElement) => {
  const ctx = sourceCanvas.getContext('2d');

  if (!ctx) {
    return sourceCanvas;
  }

  const { width, height } = sourceCanvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return sourceCanvas;
  }

  const trimmedCanvas = document.createElement('canvas');
  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');

  if (!trimmedCtx) {
    return sourceCanvas;
  }

  trimmedCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight
  );

  return trimmedCanvas;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, alpha: number) => start + (end - start) * alpha;

const smoothPoint = (
  previous: { x: number; y: number } | undefined,
  next: { x: number; y: number },
  alpha: number
) => {
  if (!previous) {
    return next;
  }

  return {
    x: lerp(previous.x, next.x, alpha),
    y: lerp(previous.y, next.y, alpha)
  };
};

const smoothMetrics = (
  previous: BodyFrameMetrics | null,
  next: BodyFrameMetrics,
  alpha: number
): BodyFrameMetrics => {
  if (!previous) {
    return next;
  }

  return {
    upperChest: smoothPoint(previous.upperChest, next.upperChest, alpha),
    shoulderCenter: smoothPoint(previous.shoulderCenter, next.shoulderCenter, alpha),
    hipCenter: smoothPoint(previous.hipCenter, next.hipCenter, alpha),
    bodyCenter: smoothPoint(previous.bodyCenter, next.bodyCenter, alpha),
    shoulderWidth: lerp(previous.shoulderWidth, next.shoulderWidth, alpha),
    torsoHeight: lerp(previous.torsoHeight, next.torsoHeight, alpha),
    garmentHeight: lerp(previous.garmentHeight, next.garmentHeight, alpha),
    rotation: lerp(previous.rotation, next.rotation, alpha)
  };
};

const GARMENT_PROFILES: Record<string, {
  widthMultiplier: number;
  minWidth: number;
  torsoHeightMultiplier: number;
  minHeight: number;
  necklineOffset: number;
  rotationInfluence: number;
}> = {
  kurta: {
    widthMultiplier: 1.42,
    minWidth: 170,
    torsoHeightMultiplier: 2.15,
    minHeight: 300,
    necklineOffset: 0.16,
    rotationInfluence: 0.4
  },
  lehenga: {
    widthMultiplier: 1.68,
    minWidth: 220,
    torsoHeightMultiplier: 2.8,
    minHeight: 420,
    necklineOffset: 0.15,
    rotationInfluence: 0.6
  },
  saree: {
    widthMultiplier: 1.52,
    minWidth: 220,
    torsoHeightMultiplier: 2.6,
    minHeight: 400,
    necklineOffset: 0.14,
    rotationInfluence: 0.55
  },
  dress: {
    widthMultiplier: 1.46,
    minWidth: 190,
    torsoHeightMultiplier: 2.05,
    minHeight: 320,
    necklineOffset: 0.15,
    rotationInfluence: 0.55
  }
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(removeSimpleBackground(image));
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });

const stopMediaStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const DressTryOnCamera: React.FC<DressTryOnCameraProps> = ({
  selectedImage,
  garmentType,
  scale,
  mirror,
  onAvailabilityChange
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<InstanceType<NonNullable<typeof window.Pose>> | null>(null);
  const garmentImageRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothedMetricsRef = useRef<BodyFrameMetrics | null>(null);
  const [status, setStatus] = useState('Starting body camera...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      setError('No dress image available for try-on.');
      onAvailabilityChange?.(false);
      return;
    }

    let cancelled = false;
    let localStream: MediaStream | null = null;

    const initialize = async () => {
      try {
        setError(null);
        onAvailabilityChange?.(false);
        setStatus('Loading body tracking...');
        await Promise.all(SCRIPT_URLS.map(ensureScript));
        garmentImageRef.current = await loadImage(selectedImage);

        if (cancelled) {
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support webcam access.');
        }

        if (!window.Pose || !videoRef.current) {
          throw new Error('MediaPipe Pose failed to load.');
        }

        const pose = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        pose.onResults((results: PoseResults) => {
          drawResults(results);
        });

        poseRef.current = pose;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 1280 }
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
          if (!videoRef.current || !poseRef.current || cancelled) {
            return;
          }

          if (videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            await poseRef.current.send({ image: videoRef.current });
          }

          animationFrameRef.current = window.requestAnimationFrame(() => {
            processFrame().catch((frameError) => {
              console.error('[DressTryOnCamera] frame:error', frameError);
            });
          });
        };

        await processFrame();
        setStatus('Body camera ready. Step back so your full outfit is visible.');
        onAvailabilityChange?.(true);
      } catch (cameraError: any) {
        console.error('[DressTryOnCamera] initialize:error', cameraError);
        if (!cancelled) {
          const friendlyMessage =
            cameraError?.name === 'NotFoundError' || cameraError?.name === 'DevicesNotFoundError'
              ? 'No camera was found. Connect or enable a webcam and try again.'
              : cameraError?.name === 'NotAllowedError'
                ? 'Camera access was blocked. Please allow camera permission and try again.'
                : cameraError?.name === 'NotReadableError' || cameraError?.name === 'AbortError'
                  ? 'The camera is busy or could not be started. Close other apps or tabs using the camera and try again.'
                  : cameraError?.message || 'Unable to start the dress try-on camera.';
          setError(friendlyMessage);
          setStatus('Body try-on unavailable.');
          onAvailabilityChange?.(false);
          showErrorToast(cameraError, friendlyMessage);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      poseRef.current?.close?.();
      poseRef.current = null;
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
      smoothedMetricsRef.current = null;
    };
  }, [onAvailabilityChange, selectedImage]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    loadImage(selectedImage)
      .then((image) => {
        garmentImageRef.current = image;
      })
      .catch((imageError) => {
        console.error('[DressTryOnCamera] selectedImage:error', imageError);
        setError('Unable to process the selected dress image.');
        onAvailabilityChange?.(false);
        showErrorToast(imageError, 'Unable to process the selected dress image.');
      });
  }, [onAvailabilityChange, selectedImage]);

  const drawGarment = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const drawResults = (results: PoseResults) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const garmentImage = garmentImageRef.current;

    if (!video || !canvas || !garmentImage) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = video.videoWidth || 960;
    const height = video.videoHeight || 1280;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    const landmarks = results.poseLandmarks;
    if (!landmarks || landmarks.length < 29) {
      setStatus('Body not detected. Step back and keep your full upper body visible.');
      return;
    }

    const point = (index: number) => ({
      x: landmarks[index].x * width,
      y: landmarks[index].y * height,
      visibility: landmarks[index].visibility ?? 1
    });

    const leftShoulder = point(11);
    const rightShoulder = point(12);
    const leftHip = point(23);
    const rightHip = point(24);

    const requiredPoints = [leftShoulder, rightShoulder, leftHip, rightHip];
    const hasVisibleCore = requiredPoints.every((bodyPoint) => bodyPoint.visibility > 0.35);

    if (!hasVisibleCore) {
      setStatus('Turn toward the camera so your shoulders and hips are visible.');
      return;
    }

    setStatus('Body tracking active.');

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const profile = GARMENT_PROFILES[garmentType?.toLowerCase() || ''] || GARMENT_PROFILES.dress;
    const upperChest = {
      x: shoulderCenter.x,
      y: lerp(shoulderCenter.y, hipCenter.y, 0.18)
    };
    const torsoVectorX = hipCenter.x - upperChest.x;
    const torsoVectorY = hipCenter.y - upperChest.y;
    const shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y);
    const torsoHeight = Math.max(Math.hypot(torsoVectorX, torsoVectorY), shoulderWidth * 1.15);
    const shoulderRotation = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    const hipRotation = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
    const baseRotation = shoulderRotation * 0.7 + hipRotation * 0.3;
    const rotation = clamp(baseRotation * profile.rotationInfluence, -0.28, 0.28);
    const garmentHeight = Math.max(torsoHeight * profile.torsoHeightMultiplier * scale, profile.minHeight);
    const bodyCenter = {
      x: (upperChest.x + hipCenter.x) / 2,
      y: (upperChest.y + hipCenter.y) / 2
    };
    const nextMetrics: BodyFrameMetrics = {
      upperChest,
      shoulderCenter,
      hipCenter,
      bodyCenter,
      shoulderWidth,
      torsoHeight,
      garmentHeight,
      rotation
    };
    const metrics = smoothMetrics(smoothedMetricsRef.current, nextMetrics, 0.28);
    smoothedMetricsRef.current = metrics;

    const garmentWidth = Math.max(metrics.shoulderWidth * profile.widthMultiplier * scale, profile.minWidth);
    const centerX = metrics.shoulderCenter.x;
    const centerY = metrics.upperChest.y + metrics.garmentHeight * (0.5 - profile.necklineOffset);

    drawGarment(ctx, garmentImage, centerX, centerY, garmentWidth, metrics.garmentHeight, metrics.rotation);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-950 p-3 shadow-inner">
      <div className="relative overflow-hidden rounded-[1.25rem]">
        <div className="relative aspect-[3/4] w-full">
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

export default DressTryOnCamera;
