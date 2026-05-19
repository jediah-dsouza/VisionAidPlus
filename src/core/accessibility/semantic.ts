export const SemanticUtils = {
  formatToggleLabel(label: string, isOn: boolean): string {
    return `${label}, ${isOn ? 'on' : 'off'}`;
  },

  formatProgressLabel(current: number, total: number): string {
    const percentage = Math.round((current / total) * 100);
    return `${current} of ${total}, ${percentage}%`;
  },

  formatTimeRemaining(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds remaining`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minutes remaining`;
    }
    return `${minutes} minutes ${remainingSeconds} seconds remaining`;
  },

  formatSliderLabel(value: number, min: number, max: number, unit = ''): string {
    const percentage = Math.round(((value - min) / (max - min)) * 100);
    const unitStr = unit ? ` ${unit}` : '';
    return `${value}${unitStr}, ${percentage}%`;
  },

  formatNotification(type: 'success' | 'warning' | 'error' | 'info', message: string): string {
    const prefixes = {
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      info: 'Information',
    };
    return `${prefixes[type]}: ${message}`;
  },

  truncateForScreenReader(text: string, maxLength = 120): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },
};

export default SemanticUtils;
