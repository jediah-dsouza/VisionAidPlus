export const AI_EVENTS = {
  FRAME_CAPTURED: 'ai:frameCaptured',
  DETECTION_RECEIVED: 'ai:detectionReceived',
  DETECTION_CLASSIFIED: 'ai:detectionClassified',
  DETECTIONS_RENDER: 'ai:detectionsRender',
  SESSION_STATE_CHANGE: 'ai:sessionStateChange',
  PIPELINE_ERROR: 'ai:pipelineError',
  FRAME_DROPPED: 'ai:frameDropped',
  QUEUE_OVERFLOW: 'ai:queueOverflow',
  THROTTLE_ADJUSTED: 'ai:throttleAdjusted',
  METRICS_UPDATE: 'ai:metricsUpdate',
} as const;
