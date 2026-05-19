import { EventPriority } from '../events/EventBus';
import { logger } from '../debug';

export type EventCategory =
  | 'emergency'
  | 'obstacle'
  | 'navigation'
  | 'alert'
  | 'device'
  | 'system'
  | 'status';

export interface PriorityMapping {
  priority: EventPriority;
  category: EventCategory;
  canInterrupt: boolean;
  messageTemplate: string;
  hapticPattern?: HapticPattern;
}

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'emergency';

interface EventToPriorityConfig {
  [key: string]: PriorityMapping;
}

const EVENT_PRIORITY_MAP: EventToPriorityConfig = {
  EMERGENCY_TRIGGERED: {
    priority: 'critical',
    category: 'emergency',
    canInterrupt: true,
    messageTemplate: 'Emergency alert activated',
    hapticPattern: 'emergency',
  },
  EMERGENCY_CANCELLED: {
    priority: 'high',
    category: 'emergency',
    canInterrupt: true,
    messageTemplate: 'Emergency cancelled',
    hapticPattern: 'success',
  },
  AI_DANGER_DETECTED: {
    priority: 'critical',
    category: 'obstacle',
    canInterrupt: true,
    messageTemplate: 'Danger detected ahead',
    hapticPattern: 'emergency',
  },
  AI_OBSTACLE_DETECTED: {
    priority: 'high',
    category: 'obstacle',
    canInterrupt: true,
    messageTemplate: 'Obstacle detected',
    hapticPattern: 'warning',
  },
  NAVIGATION_STARTED: {
    priority: 'high',
    category: 'navigation',
    canInterrupt: true,
    messageTemplate: 'Navigation started',
  },
  NAVIGATION_STOPPED: {
    priority: 'normal',
    category: 'navigation',
    canInterrupt: false,
    messageTemplate: 'Navigation stopped',
  },
  ALERT_RECEIVED: {
    priority: 'high',
    category: 'alert',
    canInterrupt: true,
    messageTemplate: 'New alert received',
    hapticPattern: 'medium',
  },
  BLE_DEVICE_CONNECTED: {
    priority: 'normal',
    category: 'device',
    canInterrupt: false,
    messageTemplate: 'Device connected',
    hapticPattern: 'success',
  },
  BLE_DEVICE_DISCONNECTED: {
    priority: 'normal',
    category: 'device',
    canInterrupt: false,
    messageTemplate: 'Device disconnected',
  },
  BLE_SIGNAL_WEAK: {
    priority: 'high',
    category: 'device',
    canInterrupt: true,
    messageTemplate: 'Device signal weak',
    hapticPattern: 'warning',
  },
  BLE_ERROR: {
    priority: 'high',
    category: 'device',
    canInterrupt: true,
    messageTemplate: 'Device error',
    hapticPattern: 'error',
  },
  LOW_BATTERY_WARNING: {
    priority: 'high',
    category: 'device',
    canInterrupt: true,
    messageTemplate: 'Low battery warning',
    hapticPattern: 'warning',
  },
  TTS_PLAYBACK_STARTED: {
    priority: 'low',
    category: 'system',
    canInterrupt: false,
    messageTemplate: '',
  },
  TTS_PLAYBACK_COMPLETED: {
    priority: 'low',
    category: 'system',
    canInterrupt: false,
    messageTemplate: '',
  },
  TTS_ERROR: {
    priority: 'normal',
    category: 'system',
    canInterrupt: false,
    messageTemplate: 'Voice error',
  },
  CAMERA_INITIALIZED: {
    priority: 'low',
    category: 'system',
    canInterrupt: false,
    messageTemplate: 'Camera ready',
  },
  CAMERA_ERROR: {
    priority: 'normal',
    category: 'system',
    canInterrupt: false,
    messageTemplate: 'Camera error',
  },
  AI_ERROR: {
    priority: 'normal',
    category: 'system',
    canInterrupt: false,
    messageTemplate: 'Detection error',
  },
};

export class EventPriorityMapper {
  getPriority(eventName: string): PriorityMapping {
    const mapping = EVENT_PRIORITY_MAP[eventName];

    if (!mapping) {
      logger.warn(`EventPriorityMapper: No mapping for event ${eventName}, using default`);
      return {
        priority: 'normal',
        category: 'system',
        canInterrupt: false,
        messageTemplate: '',
      };
    }

    return mapping;
  }

  getPriorityLevel(eventName: string): EventPriority {
    return this.getPriority(eventName).priority;
  }

  canInterrupt(eventName: string): boolean {
    return this.getPriority(eventName).canInterrupt;
  }

  getCategory(eventName: string): EventCategory {
    return this.getPriority(eventName).category;
  }

  getHapticPattern(eventName: string): HapticPattern | undefined {
    return this.getPriority(eventName).hapticPattern;
  }

  getAllCategories(): EventCategory[] {
    return ['emergency', 'obstacle', 'navigation', 'alert', 'device', 'system', 'status'];
  }

  getEventsByCategory(category: EventCategory): string[] {
    const events: string[] = [];

    for (const [eventName, mapping] of Object.entries(EVENT_PRIORITY_MAP)) {
      if (mapping.category === category) {
        events.push(eventName);
      }
    }

    return events;
  }

  getEventsByPriority(priority: EventPriority): string[] {
    const events: string[] = [];

    for (const [eventName, mapping] of Object.entries(EVENT_PRIORITY_MAP)) {
      if (mapping.priority === priority) {
        events.push(eventName);
      }
    }

    return events;
  }
}

export const eventPriorityMapper = new EventPriorityMapper();
