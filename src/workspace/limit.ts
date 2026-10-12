/**
 * Runs at most `max` jobs at once; the rest wait in order, and a finished
 * job hands its slot straight to the next one waiting.
 */
export function createLimiter(
  max: number,
): <T>(job: () => Promise<T>) => Promise<T> {
  let active = 0;
  const waiting: (() => void)[] = [];
  const acquire = () => {
    if (active < max) {
      active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => waiting.push(resolve));
  };
  const release = () => {
    const next = waiting.shift();
    if (next === undefined) active--;
    else next();
  };
  return async (job) => {
    await acquire();
    try {
      return await job();
    } finally {
      release();
    }
  };
}
