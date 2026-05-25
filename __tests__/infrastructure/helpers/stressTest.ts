export interface StressTestConfig {
  iterations: number;
  concurrency: number;
  operation: () => Promise<unknown> | unknown;
  description?: string;
}

export interface StressTestResult {
  totalIterations: number;
  passed: number;
  failed: number;
  errors: Error[];
  durationMs: number;
}

export async function runStressTest(config: StressTestConfig): Promise<StressTestResult> {
  const { iterations, operation, description } = config;
  const start = Date.now();
  const errors: Error[] = [];
  let passed = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      await operation();
      passed++;
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return {
    totalIterations: iterations,
    passed,
    failed: errors.length,
    errors,
    durationMs: Date.now() - start,
  };
}

export async function runConcurrentStressTest(
  config: StressTestConfig,
): Promise<StressTestResult> {
  const { iterations, operation } = config;
  const start = Date.now();
  const errors: Error[] = [];
  let passed = 0;

  const batches = Math.ceil(iterations / config.concurrency);
  for (let batch = 0; batch < batches; batch++) {
    const count = Math.min(config.concurrency, iterations - batch * config.concurrency);
    const results = await Promise.allSettled(
      Array.from({ length: count }, () => {
        try {
          return Promise.resolve(operation());
        } catch (error) {
          return Promise.reject(error);
        }
      }),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        passed++;
      } else {
        errors.push(result.reason instanceof Error ? result.reason : new Error(String(result.reason)));
      }
    }
  }

  return {
    totalIterations: iterations,
    passed,
    failed: errors.length,
    errors,
    durationMs: Date.now() - start,
  };
}

export function stressTestRunner(
  testName: string,
  config: StressTestConfig,
): () => Promise<void> {
  return async () => {
    const result = await runStressTest(config);
    expect(result.failed).toBe(0);
    expect(result.passed).toBe(config.iterations);
  };
}
