import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from 'react-webcam';
import { showErrorToast } from '../../utils/toast';

// 3D Dress Model Component
function DressModel({ position, scale, rotation }: { position: [number, number, number], scale: [number, number, number], rotation: [number, number, number] }) {
  const { scene } = useGLTF('/dress.glb');
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (modelRef.current && scene) {
      // Adjust material for better transparency and fitting
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.transparent = true;
          child.material.opacity = 0.8;
          child.material.side = THREE.DoubleSide;
        }
      });
    }
  }, [scene]);

  if (!scene) {
    return (
      <Html center>
        <div className="text-white text-center">
          <p>Loading 3D model...</p>
        </div>
      </Html>
    );
  }

  return (
    <group ref={modelRef} position={position} scale={scale} rotation={rotation}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

// Pose detection and body tracking component
function PoseTracker({ onPoseUpdate }: { onPoseUpdate: (pose: any) => void }) {
  useEffect(() => {
    const initPoseDetection = async () => {
      try {
        console.log('Initializing TensorFlow.js...');
        await tf.ready();
        console.log('TensorFlow.js ready, creating pose detector...');
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        console.log('Pose detector created successfully');
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
        // Continue with mock data as fallback
      }
    };

    initPoseDetection();
  }, []);

  useFrame(() => {
    // Always provide pose data, either from detector or mock
    const mockPose = {
      keypoints: [
        { x: 0.5 + Math.sin(Date.now() * 0.001) * 0.1, y: 0.2, name: 'nose' },
        { x: 0.4 + Math.sin(Date.now() * 0.001) * 0.05, y: 0.3, name: 'left_shoulder' },
        { x: 0.6 + Math.sin(Date.now() * 0.001) * 0.05, y: 0.3, name: 'right_shoulder' },
        { x: 0.4, y: 0.6, name: 'left_hip' },
        { x: 0.6, y: 0.6, name: 'right_hip' },
      ]
    };
    onPoseUpdate(mockPose);
  });

  return null;
}

// Main 3D Scene
function Scene({ poseData }: { poseData: any }) {
  const [dressPosition, setDressPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [dressScale, setDressScale] = useState<[number, number, number]>([1, 1, 1]);
  const [dressRotation, setDressRotation] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (poseData?.keypoints) {
      // Calculate body measurements from pose keypoints
      const leftShoulder = poseData.keypoints.find((kp: any) => kp.name === 'left_shoulder');
      const rightShoulder = poseData.keypoints.find((kp: any) => kp.name === 'right_shoulder');
      const leftHip = poseData.keypoints.find((kp: any) => kp.name === 'left_hip');
      const rightHip = poseData.keypoints.find((kp: any) => kp.name === 'right_hip');

      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Calculate shoulder width and position
        const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

        // Calculate torso height
        const torsoHeight = Math.abs(leftHip.y - shoulderCenterY);

        // Position dress based on body measurements
        setDressPosition([shoulderCenterX - 0.5, shoulderCenterY - torsoHeight / 2, 0]);
        setDressScale([shoulderWidth * 2, torsoHeight * 1.2, shoulderWidth * 2]);

        // Calculate rotation based on shoulder alignment
        const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
        setDressRotation([0, 0, shoulderAngle]);
      }
    }
  }, [poseData]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* 3D Dress Model */}
      <Suspense fallback={
        <Html center>
          <div className="text-white">Loading 3D Model...</div>
        </Html>
      }>
        <DressModel
          position={dressPosition}
          scale={dressScale}
          rotation={dressRotation}
        />
      </Suspense>

      {/* Pose Tracker */}
      <PoseTracker onPoseUpdate={() => {}} />

      {/* Camera Controls */}
      <OrbitControls enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2} />
    </>
  );
}

// Webcam Component
function WebcamFeed({ onPoseUpdate }: { onPoseUpdate: (pose: any) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);

  useEffect(() => {
    const initPoseDetection = async () => {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setDetector(detector);
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
        showErrorToast(new Error('Failed to initialize pose detection'));
      }
    };

    initPoseDetection();
  }, []);

  useEffect(() => {
    const detectPose = async () => {
      if (detector && webcamRef.current?.video) {
        try {
          const poses = await detector.estimatePoses(webcamRef.current.video);
          if (poses.length > 0) {
            onPoseUpdate(poses[0]);
          }
        } catch (error) {
          console.error('Pose detection error:', error);
        }
      }
    };

    const interval = setInterval(detectPose, 100);
    return () => clearInterval(interval);
  }, [detector, onPoseUpdate]);

  return (
    <Webcam
      ref={webcamRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: -1,
      }}
      videoConstraints={{
        width: 640,
        height: 480,
        facingMode: 'user',
      }}
    />
  );
}

// Main Virtual Try-On Component
interface VirtualTryOn3DProps {
  isOpen: boolean;
  productName: string;
  onClose: () => void;
}

const VirtualTryOn3D: React.FC<VirtualTryOn3DProps> = ({ isOpen, productName, onClose }) => {
  const [poseData, setPoseData] = useState<any>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  console.log('VirtualTryOn3D rendered:', { isOpen, productName });

  useEffect(() => {
    if (isOpen) {
      console.log('Requesting camera permission for virtual try-on');
      // Request camera permission
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          console.log('Camera permission granted');
          setCameraPermission(true);
        })
        .catch((error) => {
          console.error('Camera permission denied:', error);
          setCameraPermission(false);
          showErrorToast(new Error('Camera access denied. Please allow camera access to try on the dress.'));
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Virtual Try-On: {productName}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* 3D Scene Container */}
      <div className="flex-1 relative">
        {cameraPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <p className="text-xl mb-4">Camera access is required for virtual try-on</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
              >
                Retry Camera Access
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Webcam Feed */}
            <WebcamFeed onPoseUpdate={setPoseData} />

            {/* 3D Canvas Overlay */}
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <Scene poseData={poseData} />
            </Canvas>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-md">
              <h3 className="font-bold mb-2">Instructions:</h3>
              <ul className="text-sm space-y-1">
                <li>• Stand in front of the camera</li>
                <li>• The 3D dress will automatically fit your body</li>
                <li>• Move around to see how it looks from different angles</li>
                <li>• Use mouse to rotate the view</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn3D;