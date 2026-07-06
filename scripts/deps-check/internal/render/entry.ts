import { describeViolation, type TaggedViolation } from '../violation';

/** Platform qualifier, shown only when an entry does NOT cover every cruised platform. */
function platformTag(tagged: TaggedViolation, platformCount: number): string {
  return tagged.platforms.length === platformCount ? '' : ` (${tagged.platforms.join('+')} only)`;
}

/** A violation occurrence as one list entry, qualified by platform when partial. */
export const violationEntry = {
  terminal(tagged: TaggedViolation, platformCount: number): string {
    return `    ${describeViolation(tagged.violation)}${platformTag(tagged, platformCount)}`;
  },
  markdown(tagged: TaggedViolation, platformCount: number): string {
    return `- \`${describeViolation(tagged.violation)}\`${platformTag(tagged, platformCount)}`;
  },
};
