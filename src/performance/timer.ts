import { logger } from '@/logger';

export class Timer {
  public timers = new Map<string, { startTime: number; params?: Record<string, unknown> }>();

  start(name: string, params?: Record<string, unknown>) {
    this.timers.set(name, {
      startTime: performance.now(),
      params,
    });
  }

  stop(name: string) {
    const timer = this.timers.get(name);
    if (!timer) {
      logger.debug(`[Timer]: ${name} not found`);
      return;
    }
    const duration = Math.round((performance.now() - timer.startTime) * 100) / 100;
    this.timers.delete(name);
    return { duration, params: timer.params };
  }
}
