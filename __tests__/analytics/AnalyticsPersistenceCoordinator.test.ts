import { AnalyticsPersistenceCoordinator } from '../../src/core/analytics/AnalyticsPersistenceCoordinator';

describe('AnalyticsPersistenceCoordinator', () => {
  let persistence: AnalyticsPersistenceCoordinator;

  beforeEach(() => {
    persistence = new AnalyticsPersistenceCoordinator();
  });

  afterEach(() => {
    persistence.destroy();
  });

  it('saveSnapshot and loadSnapshot round-trips data', async () => {
    const data = { test: true, count: 42 };
    await persistence.saveSnapshot('key1', data);
    await persistence.flushNow();
    const loaded = await persistence.loadSnapshot<typeof data>('key1');
    expect(loaded).toEqual(data);
  });

  it('loadSnapshot returns null for missing key', async () => {
    const result = await persistence.loadSnapshot('nonexistent');
    expect(result).toBeNull();
  });

  it('deleteSnapshot removes data', async () => {
    await persistence.saveSnapshot('key1', { value: 1 });
    await persistence.flushNow();
    await persistence.deleteSnapshot('key1');
    const loaded = await persistence.loadSnapshot('key1');
    expect(loaded).toBeNull();
  });

  it('clearAll removes all data', async () => {
    await persistence.saveSnapshot('k1', { a: 1 });
    await persistence.saveSnapshot('k2', { b: 2 });
    await persistence.flushNow();
    await persistence.clearAll();
    expect(await persistence.loadSnapshot('k1')).toBeNull();
    expect(await persistence.loadSnapshot('k2')).toBeNull();
  });

  it('tracks storage size', async () => {
    await persistence.saveSnapshot('k1', { value: 'hello' });
    await persistence.flushNow();
    expect(persistence.storageSize).toBeGreaterThan(0);
  });

  it('flushNow flushes pending writes', async () => {
    await persistence.saveSnapshot('k1', { x: 1 });
    await persistence.flushNow();
    const loaded = await persistence.loadSnapshot('k1');
    expect(loaded).toEqual({ x: 1 });
  });

  it('does not operate after destroy', async () => {
    persistence.destroy();
    await persistence.saveSnapshot('k1', { x: 1 });
    await persistence.flushNow();
    const loaded = await persistence.loadSnapshot('k1');
    expect(loaded).toBeNull();
  });

  it('handles corrupted data gracefully', async () => {
    (persistence as any).storage.set('bad', '{invalid json!!!}');
    const loaded = await persistence.loadSnapshot('bad');
    expect(loaded).toBeNull();
  });
});
