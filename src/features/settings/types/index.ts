import type { Settings } from '@shared/types';

export interface SettingsState extends Settings {}

export interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  fields: Array<{
    key: keyof Settings;
    label: string;
    type: 'toggle' | 'select' | 'slider' | 'input';
    options?: string[];
    min?: number;
    max?: number;
  }>;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
}
