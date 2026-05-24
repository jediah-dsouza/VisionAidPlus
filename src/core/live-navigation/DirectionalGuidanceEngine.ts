import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { NAVIGATION_EVENTS } from './NavigationEventBus';
import { obstaclePrioritizationEngine } from './ObstaclePrioritizationEngine';
import type {
  Obstacle, GuidanceInstruction, ObstacleDirection, ObstacleSeverity,
  GuidanceType, HapticPattern, NavigationConfig,
} from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';

const DIRECTION_LABELS: Record<ObstacleDirection, string> = {
  'front': 'ahead',
  'center': 'ahead',
  'front-left': 'to your front left',
  'front-right': 'to your front right',
  'left': 'to your left',
  'right': 'to your right',
  'behind': 'behind you',
  'unknown': 'nearby',
};

const DISTANCE_LABELS = [
  { max: 30, label: 'very close' },
  { max: 80, label: 'close' },
  { max: 200, label: 'a few meters ahead' },
  { max: 500, label: 'further ahead' },
];

function formatDistance(cm: number): string {
  const entry = DISTANCE_LABELS.find(d => cm <= d.max);
  return entry?.label ?? 'in the distance';
}

function getHapticForSeverity(severity: ObstacleSeverity): HapticPattern {
  switch (severity) {
    case 'critical': return 'emergency';
    case 'danger': return 'heavy';
    case 'caution': return 'medium';
    case 'safe': return 'light';
  }
}

export class DirectionalGuidanceEngine {
  private config: NavigationConfig;
  private destroyed = false;
  private lastAnnouncementTimestamps = new Map<string, number>();
  private instructionCounter = 0;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
  }

  private now(): number {
    return Date.now();
  }

  canAnnounce(type: string): boolean {
    const last = this.lastAnnouncementTimestamps.get(type) ?? 0;
    return this.now() - last >= this.config.announcementCooldownMs;
  }

  generateInstruction(obstacle: Obstacle): GuidanceInstruction | null {
    if (this.destroyed) return null;

    const type = this.getGuidanceType(obstacle);
    const text = this.buildInstructionText(obstacle, type);

    if (!text) return null;

    const throttleKey = `${type}:${obstacle.direction}`;
    if (!this.canAnnounce(throttleKey)) return null;

    this.instructionCounter++;
    const now = this.now();

    const instruction: GuidanceInstruction = {
      id: `guidance_${now}_${this.instructionCounter}`,
      type,
      text,
      priority: type === 'danger_alert' ? 'critical' : type === 'warning' ? 'high' : 'normal',
      direction: obstacle.direction,
      distanceCm: obstacle.distanceCm,
      severity: obstacle.severity,
      issuedAt: now,
      expiresAt: now + 5000,
      hapticPattern: getHapticForSeverity(obstacle.severity),
      spoken: false,
    };

    this.lastAnnouncementTimestamps.set(throttleKey, now);

    eventBus.publish(NAVIGATION_EVENTS.GUIDANCE_ISSUED, { instruction }, instruction.priority);
    return instruction;
  }

  generateRouteInstruction(
    direction: ObstacleDirection,
    distanceCm: number,
    stepDescription: string,
  ): GuidanceInstruction {
    this.instructionCounter++;
    const now = this.now();

    return {
      id: `route_${now}_${this.instructionCounter}`,
      type: 'direction',
      text: stepDescription,
      priority: 'high',
      direction,
      distanceCm,
      issuedAt: now,
      expiresAt: now + 8000,
      hapticPattern: 'navigation_turn',
      spoken: false,
    };
  }

  generateArrivalInstruction(): GuidanceInstruction {
    this.instructionCounter++;
    const now = this.now();

    return {
      id: `arrival_${now}_${this.instructionCounter}`,
      type: 'arrival',
      text: 'You have arrived at your destination.',
      priority: 'high',
      issuedAt: now,
      expiresAt: now + 10000,
      hapticPattern: 'navigation_turn',
      spoken: false,
    };
  }

  private getGuidanceType(obstacle: Obstacle): GuidanceType {
    if (obstacle.severity === 'critical') return 'danger_alert';
    if (obstacle.severity === 'danger') return 'warning';
    if (obstacle.distanceCm < 50) return 'warning';
    return 'direction';
  }

  private buildInstructionText(obstacle: Obstacle, type: GuidanceType): string | null {
    const direction = DIRECTION_LABELS[obstacle.direction] ?? 'nearby';
    const distance = formatDistance(obstacle.distanceCm);

    switch (type) {
      case 'danger_alert': {
        if (obstacle.distanceCm < 30) {
          return `Stop. ${obstacle.type} ${direction}, ${distance}`;
        }
        return `Danger. ${obstacle.type} ${direction}, ${distance}`;
      }
      case 'warning':
        return `Caution. ${obstacle.type} ${direction}, ${distance}`;
      case 'direction':
        if (obstacle.distanceCm > 300) return null;
        return `${obstacle.type} ${direction}, ${distance}`;
      default:
        return null;
    }
  }

  evaluateAndGenerateInstructions(obstacles: Obstacle[]): GuidanceInstruction[] {
    const instructions: GuidanceInstruction[] = [];
    const topObstacles = obstaclePrioritizationEngine.getTopObstacles(obstacles, 3);

    for (const obstacle of topObstacles) {
      const instruction = this.generateInstruction(obstacle);
      if (instruction) {
        instructions.push(instruction);
      }
    }

    return instructions;
  }

  getInstructionCount(): number {
    return this.instructionCounter;
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.destroyed = true;
    this.lastAnnouncementTimestamps.clear();
  }
}

export const directionalGuidanceEngine = new DirectionalGuidanceEngine();
