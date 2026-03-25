import React from 'react';
import TryOnCamera from './TryOnCamera';

type ChainTryOnProps = {
  selectedImage: string;
  scale: number;
  mirror: boolean;
  onAvailabilityChange?: (available: boolean) => void;
};

const ChainTryOn: React.FC<ChainTryOnProps> = ({
  selectedImage,
  scale,
  mirror,
  onAvailabilityChange
}) => {
  return (
    <TryOnCamera
      selectedImage={selectedImage}
      scale={scale}
      mirror={mirror}
      mode="chains"
      onAvailabilityChange={onAvailabilityChange}
    />
  );
};

export default ChainTryOn;
