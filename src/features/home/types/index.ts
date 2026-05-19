export interface HomeState {
  recentObstacles: Array<{
    type: string;
    distance: number;
    timestamp: string;
  }>;
  navigationSessionActive: boolean;
  lastEmergencyTrigger: string | null;
}

export interface DashboardData {
  deviceStatus: 'connected' | 'disconnected' | 'scanning';
  aiStatus: 'active' | 'inactive' | 'warning';
  alertCount: number;
  batteryLevel: number | null;
}
