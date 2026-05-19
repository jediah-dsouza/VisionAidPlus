import { AccessibilityInfo, findNodeHandle, View, ScrollView } from 'react-native';
import { logger } from '../debug';

export type FocusableElement = View | ScrollView;

interface FocusHistoryEntry {
  elementId: string;
  timestamp: number;
}

export interface FocusConfig {
  announceFocusChanges: boolean;
  focusHistorySize: number;
  scrollToFocusDelay: number;
}

const DEFAULT_CONFIG: FocusConfig = {
  announceFocusChanges: true,
  focusHistorySize: 20,
  scrollToFocusDelay: 100,
};

export class FocusManager {
  private config: FocusConfig;
  private currentFocusId: string | null = null;
  private focusHistory: FocusHistoryEntry[] = [];
  private focusTrapActive = false;
  private trappedElements: string[] = [];
  private onFocusAnnounce?: (message: string) => void;

  constructor(config: Partial<FocusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setFocusAnnounceListener(listener: (message: string) => void): void {
    this.onFocusAnnounce = listener;
  }

  updateConfig(partial: Partial<FocusConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getConfig(): FocusConfig {
    return { ...this.config };
  }

  async focusOn(element: FocusableElement | null, label?: string): Promise<boolean> {
    if (!element) {
      logger.warn('FocusManager: Attempted to focus on null element');
      return false;
    }

    const handle = findNodeHandle(element);
    if (!handle) {
      logger.warn('FocusManager: Could not get handle for element');
      return false;
    }

    try {
      const elementId = `focus_${handle}`;

      if (this.currentFocusId === elementId) {
        return true;
      }

      this.setFocus(elementId);

      if (this.config.announceFocusChanges && label) {
        this.announceFocus(label);
      }

      logger.debug(`FocusManager: Focused on ${elementId}`);
      return true;
    } catch (error) {
      logger.error('FocusManager: Failed to focus element', error);
      return false;
    }
  }

  private setFocus(elementId: string): void {
    this.currentFocusId = elementId;

    this.focusHistory.unshift({
      elementId,
      timestamp: Date.now(),
    });

    if (this.focusHistory.length > this.config.focusHistorySize) {
      this.focusHistory.pop();
    }
  }

  private async announceFocus(label: string): Promise<void> {
    if (this.onFocusAnnounce) {
      this.onFocusAnnounce(`Focused on ${label}`);
    }

    try {
      await AccessibilityInfo.announceForAccessibility(`Focused on ${label}`);
    } catch (error) {
      logger.error('FocusManager: Failed to announce focus', error);
    }
  }

  async blur(): Promise<void> {
    if (this.currentFocusId) {
      logger.debug(`FocusManager: Blurring ${this.currentFocusId}`);
      this.currentFocusId = null;
    }
  }

  getCurrentFocusId(): string | null {
    return this.currentFocusId;
  }

  getFocusHistory(): ReadonlyArray<FocusHistoryEntry> {
    return [...this.focusHistory];
  }

  goBack(): boolean {
    const history = this.focusHistory.slice(1);
    if (history.length > 0) {
      logger.debug(`FocusManager: Going back to ${history[0].elementId}`);
      return true;
    }
    return false;
  }

  activateFocusTrap(elementIds: string[]): void {
    this.focusTrapActive = true;
    this.trappedElements = [...elementIds];
    logger.debug(`FocusManager: Focus trap activated for ${elementIds.length} elements`);
  }

  deactivateFocusTrap(): void {
    this.focusTrapActive = false;
    this.trappedElements = [];
    logger.debug(`FocusManager: Focus trap deactivated`);
  }

  isInFocusTrap(elementId: string): boolean {
    if (!this.focusTrapActive) return false;
    return this.trappedElements.includes(elementId);
  }

  isFocusTrapActive(): boolean {
    return this.focusTrapActive;
  }

  addToTrap(elementId: string): void {
    if (!this.trappedElements.includes(elementId)) {
      this.trappedElements.push(elementId);
    }
  }

  removeFromTrap(elementId: string): void {
    const index = this.trappedElements.indexOf(elementId);
    if (index !== -1) {
      this.trappedElements.splice(index, 1);
    }
  }

  announceNavigationChange(screenName: string): void {
    this.currentFocusId = null;

    if (this.onFocusAnnounce) {
      this.onFocusAnnounce(`Navigated to ${screenName}`);
    }

    AccessibilityInfo.announceForAccessibility(`Navigated to ${screenName}`);
  }

  announceLiveRegion(update: string): void {
    AccessibilityInfo.announceForAccessibility(update);
  }

  async scrollToElement(element: View, animated = true): Promise<boolean> {
    try {
      element.measureInWindow((x, y, width, height) => {
        logger.debug(`FocusManager: Element at (${x}, ${y}) size ${width}x${height}`);
      });
      return true;
    } catch (error) {
      logger.error('FocusManager: Failed to scroll to element', error);
      return false;
    }
  }

  clearHistory(): void {
    this.focusHistory = [];
    logger.debug(`FocusManager: Cleared focus history`);
  }

  isElementFocused(elementId: string): boolean {
    return this.currentFocusId === elementId;
  }

  getRecentFocus(count = 5): string[] {
    return this.focusHistory.slice(0, count).map(entry => entry.elementId);
  }

  destroy(): void {
    this.focusHistory = [];
    this.currentFocusId = null;
    this.focusTrapActive = false;
    this.trappedElements = [];
    this.onFocusAnnounce = undefined;
    logger.debug('FocusManager: Destroyed');
  }
}

export const focusManager = new FocusManager();
