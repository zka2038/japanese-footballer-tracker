/** Small fetch helpers shared by providers: retries, backoff and a concurrency gate. */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  retries?: number;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: opts.headers });
      if (res.status === 429 || res.status >= 500) {
        throw new HttpError(res.status, url);
      }
      if (!res.ok) {
        // 4xx other than 429 will not get better by retrying.
        throw Object.assign(new HttpError(res.status, url), { fatal: true });
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if ((err as { fatal?: boolean }).fatal) break;
      if (attempt < retries) await sleep(600 * 2 ** attempt + Math.random() * 250);
    }
  }
  throw lastError;
}

/** Runs async tasks with at most `limit` in flight and a small gap between starts. */
export function createGate(limit: number, gapMs = 120) {
  let active = 0;
  let lastStart = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (active >= limit || queue.length === 0) return;
    const wait = Math.max(0, lastStart + gapMs - Date.now());
    active++;
    const run = queue.shift()!;
    setTimeout(() => {
      lastStart = Date.now();
      run();
    }, wait);
  };

  return function gate<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
  };
}
