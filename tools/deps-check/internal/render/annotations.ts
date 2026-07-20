import { policyFor } from '../../policies';
import type { Report } from '../report';
import { describeViolation } from '../violation';

/** GitHub Actions workflow-command lines annotating each failing violation. */
export function renderAnnotations({ strictViolations, newViolations }: Report): string[] {
  return [...strictViolations, ...newViolations].map(({ violation }) => {
    const { label } = policyFor(violation.rule.name);
    return `::error file=${violation.from},title=${escapeAnnotation(label)}::${escapeAnnotation(`New: ${describeViolation(violation)}`)}`;
  });
}

/**
 * GitHub Actions parses workflow commands line-by-line from stdout, so a raw
 * newline would truncate the annotation there and leave the rest of the text
 * to be re-parsed as ordinary output (or as another command); % is the escape
 * character of the command syntax itself. The %25/%0D/%0A encoding is the one
 * GitHub's docs specify for workflow-command messages.
 */
function escapeAnnotation(s: string): string {
  return s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
