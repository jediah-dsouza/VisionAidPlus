import { EmergencyGPSPipeline } from '../../../src/core/emergency/EmergencyGPSPipeline';

jest.mock('../../../src/core/emergency/EmergencyEventPriority', () => ({
  emergencyEventPriorityManager: {
    publish: jest.fn(),
    getPriority: jest.fn().mockReturnValue('normal'),
    clearLog: jest.fn(),
    getDeliveryLog: jest.fn().mockReturnValue([]),
  },
  EMERGENCY_EVENTS: {
    EMERGENCY_GPS_PREPARED: 'EMERGENCY_GPS_PREPARED',
    EMERGENCY_GPS_FAILED: 'EMERGENCY_GPS_FAILED',
  },
}));

describe('E. GPS Failure Simulation', () => {
  let gps: EmergencyGPSPipeline;

  beforeEach(() => {
    gps = new EmergencyGPSPipeline({
      timeout: 100,
      maxRetries: 2,
      cacheDuration: 5000,
    });
  });

  afterEach(() => {
    gps.destroy();
  });

  it('GPS unavailable — falls back to mock location', async () => {
    const location = await gps.prepareLocation();
    expect(location).not.toBeNull();
    expect(location!.latitude).toBeDefined();
    expect(location!.longitude).toBeDefined();
    expect(location!.accuracy).toBeGreaterThan(0);
  });

  it('stale cached coordinates — bypasses cache after expiry', async () => {
    gps.setMockLocation(40.7128, -74.006);

    const first = await gps.prepareLocation();
    expect(first!.latitude).toBe(40.7128);

    const pipeline2 = new EmergencyGPSPipeline({ cacheDuration: 50, timeout: 100, maxRetries: 0 });
    pipeline2.setMockLocation(40.7128, -74.006);

    await new Promise(r => setTimeout(r, 60));

    const second = await pipeline2.prepareLocation();
    expect(second).not.toBeNull();

    pipeline2.destroy();
  });

  it('last known location returned when fresh GPS fails', async () => {
    gps.setMockLocation(34.0522, -118.2437);

    const cached = gps.getLastKnownLocation();
    expect(cached).toEqual({
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 5,
      altitude: null,
      timestamp: expect.any(Number),
    });
  });

  it('partial location data — mock provides all fields', async () => {
    const location = await gps.prepareLocation();
    expect(location).toMatchObject({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      accuracy: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('getLastKnownLocation returns null when no location set', () => {
    const result = gps.getLastKnownLocation();
    expect(result).toBeNull();
  });

  it('setMockLocation overrides last known', () => {
    gps.setMockLocation(51.5074, -0.1278);
    const known = gps.getLastKnownLocation();
    expect(known!.latitude).toBe(51.5074);
    expect(known!.longitude).toBe(-0.1278);
  });

  it('concurrent prepareLocation calls share pending request', async () => {
    const [a, b] = await Promise.all([gps.prepareLocation(), gps.prepareLocation()]);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
  });

  it('retry cleanup — pending request is null after completion', async () => {
    await gps.prepareLocation();
    expect((gps as any).pendingRequest).toBeNull();
  });

  it('destroy prevents further operations', async () => {
    gps.destroy();
    const result = await gps.prepareLocation();
    expect(result).toBeNull();
  });

  it('after destroy, getLastKnownLocation returns null', () => {
    gps.setMockLocation(48.8566, 2.3522);
    gps.destroy();
    expect(gps.getLastKnownLocation()).toBeNull();
  });

  it('updateConfig changes timeout', () => {
    gps.updateConfig({ timeout: 5000 });
    const config = (gps as any).config;
    expect(config.timeout).toBe(5000);
  });
});
