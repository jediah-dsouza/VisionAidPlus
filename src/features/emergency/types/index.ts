export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  notifyOnEmergency: boolean;
}

export interface EmergencyState {
  status: 'idle' | 'countdown' | 'triggered' | 'sending' | 'resolved' | 'cancelled';
  countdownSeconds: number;
  contacts: EmergencyContact[];
  triggeredAt: string | null;
  error: string | null;
}

export interface EmergencyConfig {
  countdownDuration: number;
  autoNotifyPrimary: boolean;
  requireConfirmation: boolean;
  notifyAllContacts: boolean;
}
