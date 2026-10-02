import { join, resolve } from 'node:path';

// tsx runs repository scripts as CommonJS, where import.meta is unavailable.
export const ROOT = resolve(__dirname, '..', '..', '..');
export const REPORT_PATH = join(ROOT, 'deps-report.md');
export const COMMENT_PATH = join(ROOT, 'deps-comment.md');
