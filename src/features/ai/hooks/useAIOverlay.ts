import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@core/events/EventBus';
import { AI_EVENTS } from '@core/events/AI_EVENTS';
import type { DetectionContract } from '@core/camera/types';
import type { UseAIOverlayResult } from '../types';

export const useAIOverlay = (): UseAIOverlayResult => {
  const mountedRef = useRef(true);
  const [detections, setDetections] = useState<DetectionContract[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsub = eventBus.subscribe(AI_EVENTS.DETECTIONS_RENDER, (payload: unknown) => {
      if (!mountedRef.current) return;
      const { detections: batch } = payload as { detections: DetectionContract[] };
      setDetections(prev => {
        const ids = new Set(batch.map(d => d.id));
        const filtered = prev.filter(d => !ids.has(d.id));
        return [...batch, ...filtered].slice(0, 20);
      });
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  return { detections, visible, show, hide };
};
