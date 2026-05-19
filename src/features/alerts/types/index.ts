export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  source: 'ble' | 'ai' | 'system' | 'emergency';
}

export interface AlertFilter {
  type?: Alert['type'];
  source?: Alert['source'];
  read?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AlertsState {
  alerts: Alert[];
  filter: AlertFilter;
  unreadCount: number;
}
