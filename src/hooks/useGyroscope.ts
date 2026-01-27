import { useState, useEffect, useCallback } from 'react';

interface GyroscopeData {
  beta: number;  // Front-back tilt (-180 to 180)
  gamma: number; // Left-right tilt (-90 to 90)
}

interface UseGyroscopeReturn {
  tilt: GyroscopeData;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
}

export const useGyroscope = (): UseGyroscopeReturn => {
  const [tilt, setTilt] = useState<GyroscopeData>({ beta: 0, gamma: 0 });
  const [isSupported, setIsSupported] = useState(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;
    
    // Normalize values for smooth animation
    // beta: -90 to 90 (we clamp it), gamma: -45 to 45
    const normalizedBeta = Math.max(-30, Math.min(30, beta));
    const normalizedGamma = Math.max(-30, Math.min(30, gamma));
    
    setTilt({
      beta: normalizedBeta,
      gamma: normalizedGamma,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Check if DeviceOrientationEvent exists and has requestPermission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return false;
      }
    } else if ('DeviceOrientationEvent' in window) {
      // Non-iOS devices
      window.addEventListener('deviceorientation', handleOrientation, true);
      return true;
    }
    return false;
  }, [handleOrientation]);

  useEffect(() => {
    // Check if device orientation is supported
    const supported = 'DeviceOrientationEvent' in window;
    setIsSupported(supported);

    if (supported) {
      // For non-iOS devices, we can add listener directly
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  return { tilt, isSupported, requestPermission };
};
