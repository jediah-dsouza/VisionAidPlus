import { EmergencyContactManager } from '../../src/core/emergency/EmergencyContactManager';

describe('EmergencyContactManager', () => {
  let contactManager: EmergencyContactManager;

  beforeEach(() => {
    contactManager = new EmergencyContactManager();
  });

  afterEach(() => {
    contactManager.destroy();
  });

  const validContact = {
    name: 'Jane Doe',
    phone: '+1-555-0100',
    relationship: 'Spouse',
    isPrimary: true,
    notifyOnEmergency: true,
  };

  const secondaryContact = {
    name: 'John Smith',
    phone: '+1-555-0200',
    relationship: 'Friend',
    isPrimary: false,
    notifyOnEmergency: true,
  };

  it('starts with empty contacts', () => {
    expect(contactManager.getContacts()).toEqual([]);
    expect(contactManager.hasContacts()).toBe(false);
    expect(contactManager.count()).toBe(0);
  });

  it('adds a contact', async () => {
    const contact = await contactManager.addContact(validContact);

    expect(contact.id).toBeDefined();
    expect(contact.name).toBe('Jane Doe');
    expect(contact.isPrimary).toBe(true);
    expect(contactManager.hasContacts()).toBe(true);
    expect(contactManager.count()).toBe(1);
  });

  it('sets only one primary contact', async () => {
    await contactManager.addContact(validContact);
    await contactManager.addContact({ ...secondaryContact, isPrimary: true });

    const contacts = contactManager.getContacts();
    const primaries = contacts.filter(c => c.isPrimary);
    expect(primaries.length).toBe(1);
  });

  it('gets primary contact', async () => {
    await contactManager.addContact(secondaryContact);
    await contactManager.addContact(validContact);

    const primary = contactManager.getPrimaryContact();
    expect(primary).toBeDefined();
    expect(primary?.name).toBe('Jane Doe');
  });

  it('gets notifiable contacts', async () => {
    await contactManager.addContact(validContact);
    await contactManager.addContact({ ...secondaryContact, notifyOnEmergency: false });

    const notifiable = contactManager.getNotifiableContacts();
    expect(notifiable.length).toBe(1);
    expect(notifiable[0].name).toBe('Jane Doe');
  });

  it('updates a contact', async () => {
    const contact = await contactManager.addContact(validContact);
    const updated = await contactManager.updateContact(contact.id, { name: 'Jane Smith' });

    expect(updated.name).toBe('Jane Smith');
    expect(updated.phone).toBe('+1-555-0100');
  });

  it('updating to primary demotes others', async () => {
    const c1 = await contactManager.addContact(validContact);
    const c2 = await contactManager.addContact(secondaryContact);
    await contactManager.updateContact(c2.id, { isPrimary: true });

    const contacts = contactManager.getContacts();
    expect(contacts.find(c => c.id === c1.id)?.isPrimary).toBe(false);
    expect(contacts.find(c => c.id === c2.id)?.isPrimary).toBe(true);
  });

  it('removes a contact', async () => {
    const contact = await contactManager.addContact(validContact);
    await contactManager.removeContact(contact.id);

    expect(contactManager.count()).toBe(0);
    expect(contactManager.hasContacts()).toBe(false);
  });

  it('throws on removing non-existent contact', async () => {
    await expect(contactManager.removeContact('nonexistent')).rejects.toThrow('Contact not found');
  });

  it('gets contact by id', async () => {
    const contact = await contactManager.addContact(validContact);
    const found = contactManager.getContactById(contact.id);

    expect(found).toBeDefined();
    expect(found?.name).toBe('Jane Doe');
  });

  it('returns undefined for unknown id', () => {
    expect(contactManager.getContactById('unknown')).toBeUndefined();
  });

  it('validates contact name required', () => {
    const result = contactManager.validateContact({ phone: '+1-555-0100', relationship: 'Spouse' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('validates contact phone required', () => {
    const result = contactManager.validateContact({ name: 'Jane', relationship: 'Spouse' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Phone number is required');
  });

  it('validates phone format', () => {
    const result = contactManager.validateContact({
      name: 'Jane',
      phone: 'not-a-phone',
      relationship: 'Spouse',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid phone number format');
  });

  it('validates valid contact', () => {
    const result = contactManager.validateContact(validContact);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('notifies change listeners', async () => {
    const listener = jest.fn();
    contactManager.onChange(listener);

    await contactManager.addContact(validContact);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: 'Jane Doe' })]));
  });

  it('sets contacts with validation', async () => {
    await contactManager.setContacts([validContact, secondaryContact]);
    expect(contactManager.count()).toBe(2);
  });

  it('rejects contacts with multiple primaries', async () => {
    await expect(
      contactManager.setContacts([
        validContact,
        { ...secondaryContact, isPrimary: true },
      ]),
    ).rejects.toThrow('Only one primary contact allowed');
  });

  it('resets to empty', async () => {
    await contactManager.addContact(validContact);
    contactManager.reset();

    expect(contactManager.count()).toBe(0);
    expect(contactManager.hasContacts()).toBe(false);
  });

  it('throws after destroy', async () => {
    contactManager.destroy();
    await expect(contactManager.addContact(validContact)).rejects.toThrow('ContactManager destroyed');
  });
});
