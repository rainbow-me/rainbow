/**
 * #### `⏱️ TimeFormatter ⏱️`
 *
 * A worklet class that handles formatting chart labels and timestamps,
 * respecting the current locale.
 *
 * 💡 *Note:* This class can only be used from the UI thread.
 */
export class TimeFormatter {
  private __workletClass = true;

  private readonly hour12Mode: boolean = new Intl.DateTimeFormat(undefined, { hour: '2-digit' }).resolvedOptions().hour12 ?? true;
  private readonly monthNames: string[] = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2020, i, 1))
  );

  public format(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    let h = date.getHours();
    let suffix = '';
    if (this.hour12Mode) {
      suffix = h < 12 ? ' AM' : ' PM';
      h = h % 12 || 12;
    }
    const hh = String(h).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const mon = this.monthNames[date.getMonth()];
    const dd = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${hh}:${mm}${suffix} ${mon} ${dd}, ${year}`;
  }
}
