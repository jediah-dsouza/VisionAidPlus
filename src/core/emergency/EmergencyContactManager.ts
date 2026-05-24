import type { EmergencyContact } from '@shared/types';
import { logger } from '../debug';

export interface ContactValidationResult {
  valid: boolean;
  errors: string[];
}

export class EmergencyContactManager {
  private contacts: EmergencyContact[] = [];
  private destroyed = false;
  private changeListeners: Array<(contacts: EmergencyContact[]) => void> = [];

  getContacts(): EmergencyContact[] {
    return [...this.contacts];
  }

  getPrimaryContact(): EmergencyContact | undefined {
    return this.contacts.find(c => c.isPrimary && c.notifyOnEmergency);
  }

  getNotifiableContacts(): EmergencyContact[] {
    return this.contacts.filter(c => c.notifyOnEmergency);
  }

  getContactById(id: string): EmergencyContact | undefined {
    return this.contacts.find(c => c.id === id);
  }

  async addContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    if (this.destroyed) throw new Error('ContactManager destroyed');

    const validation = this.validateContact(contact);
    if (!validation.valid) {
      throw new Error(`Invalid contact: ${validation.errors.join(', ')}`);
    }

    const newContact: EmergencyContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };

    if (newContact.isPrimary) {
      this.contacts = this.contacts.map(c => ({ ...c, isPrimary: false }));
    }

    this.contacts.push(newContact);
    this.notifyListeners();

    logger.info(`[EmergencyContact] Added: ${newContact.name} (${newContact.phone})`);
    return newContact;
  }

  async updateContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    if (this.destroyed) throw new Error('ContactManager destroyed');

    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Contact not found: ${id}`);

    const updated: EmergencyContact = { ...this.contacts[index], ...updates, id };

    if (updates.isPrimary) {
      this.contacts = this.contacts.map(c => ({ ...c, isPrimary: c.id === id }));
    }

    this.contacts[index] = updated;
    this.notifyListeners();

    logger.info(`[EmergencyContact] Updated: ${updated.name}`);
    return updated;
  }

  async removeContact(id: string): Promise<void> {
    if (this.destroyed) throw new Error('ContactManager destroyed');

    const contact = this.contacts.find(c => c.id === id);
    if (!contact) throw new Error(`Contact not found: ${id}`);

    this.contacts = this.contacts.filter(c => c.id !== id);
    this.notifyListeners();

    logger.info(`[EmergencyContact] Removed: ${contact.name} (${contact.phone})`);
  }

  async setContacts(contacts: EmergencyContact[]): Promise<void> {
    if (this.destroyed) throw new Error('ContactManager destroyed');

    for (const contact of contacts) {
      const validation = this.validateContact(contact);
      if (!validation.valid) {
        throw new Error(`Invalid contact ${contact.name}: ${validation.errors.join(', ')}`);
      }
    }

    const primaryCount = contacts.filter(c => c.isPrimary).length;
    if (primaryCount > 1) {
      throw new Error('Only one primary contact allowed');
    }

    this.contacts = [...contacts];
    this.notifyListeners();

    logger.info(`[EmergencyContact] Set ${contacts.length} contacts`);
  }

  validateContact(contact: Partial<EmergencyContact>): ContactValidationResult {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!contact.phone || contact.phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!/^[\d\s\-+()]{7,20}$/.test(contact.phone.trim())) {
      errors.push('Invalid phone number format');
    }

    if (!contact.relationship || contact.relationship.trim().length === 0) {
      errors.push('Relationship is required');
    }

    return { valid: errors.length === 0, errors };
  }

  onChange(listener: (contacts: EmergencyContact[]) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getContacts();
    for (const listener of this.changeListeners) {
      try {
        listener(snapshot);
      } catch (error) {
        logger.error('[EmergencyContact] Change listener error', error);
      }
    }
  }

  hasContacts(): boolean {
    return this.contacts.length > 0;
  }

  count(): number {
    return this.contacts.length;
  }

  reset(): void {
    this.contacts = [];
    logger.info('[EmergencyContact] Reset');
  }

  destroy(): void {
    this.destroyed = true;
    this.contacts = [];
    this.changeListeners = [];
  }
}

export const emergencyContactManager = new EmergencyContactManager();
