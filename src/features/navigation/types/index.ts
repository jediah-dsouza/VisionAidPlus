export interface NavigationState {
  status: 'idle' | 'active' | 'paused' | 'error';
  destination: string | null;
  currentInstruction: string | null;
  eta: number | null;
  distanceRemaining: number | null;
  route: Array<RouteStep>;
  error: string | null;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface NavigationConfig {
  voiceGuidance: boolean;
  hapticFeedback: boolean;
  avoidHighTraffic: boolean;
  accessibleRoute: boolean;
}

export interface DestinationSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
