let disabled = false;
const startup = Date.now();

/**
 * In-memory array of log lines
 */
const lines: object[] = [];

export function push(line: object) {
  if (!disabled) {
    lines.push(line);

    // disable after one minute so we don't fill up memory
    if (Date.now() - startup > 60_000) {
      disabled = true;
    }
  }
}

export function serialize() {
  return JSON.stringify(lines);
}
