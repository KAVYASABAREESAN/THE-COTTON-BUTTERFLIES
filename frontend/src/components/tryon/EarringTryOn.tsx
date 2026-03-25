import React from 'react';
import TryOnCamera from './TryOnCamera';

type EarringTryOnProps = {
  selectedImage: string;
  scale: number;
  mirror: boolean;
  onAvailabilityChange?: (available: boolean) => void;
};

const EarringTryOn: React.FC<EarringTryOnProps> = ({
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
      mode="earrings"
      onAvailabilityChange={onAvailabilityChange}
    />
  );
};

export default EarringTryOn;
