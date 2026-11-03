import type { z } from 'zod';

/** Reports the failing paths and issue codes only — never the received values, which may carry user data. */
export class ResponseParseError extends Error {
  constructor(source: string, issues: z.ZodIssue[]) {
    super(`Malformed response from ${source} (${issues.map(issue => `${issue.path.join('.') || '<root>'}: ${issue.code}`).join(', ')})`);
    this.name = 'ResponseParseError';
  }
}

export function parseResponse<S extends z.ZodTypeAny>(schema: S, data: unknown, source: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new ResponseParseError(source, result.error.issues);
  return result.data;
}
