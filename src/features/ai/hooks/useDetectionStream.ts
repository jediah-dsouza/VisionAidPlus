import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@core/events/EventBus';
import { AI_EVENTS } from '@core/events/AI_EVENTS';
import type { DetectionContract } from '@core/camera/types';
import type { UseDetectionStreamResult } from '../types';

export const useDetectionStream = (limit = 20): UseDetectionStreamResult => {
  const mountedRef = useRef(true);
  const [detections, setDetections] = useState<DetectionContract[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsub = eventBus.subscribe(AI_EVENTS.DETECTIONS_RENDER, (payload: unknown) => {
      if (!mountedRef.current) return;
      const { detections: batch } = payload as { detections: DetectionContract[] };
      setDetections(prev => {
        const combined = [...batch, ...prev];
        return combined.slice(0, limit);
      });
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [limit]);

  const clear = useCallback(() => {
    setDetections([]);
  }, []);

  return { detections, isVisible, clear };
};
