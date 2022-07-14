// https://rainbowhaus.slack.com/archives/C02C8JQ313N/p1657277922128049
export function numberWithoutScientificNotation(x: number): string {
  let stringValue: string = x.toString();
  let res = x;
  if (Math.abs(x) < 1.0) {
    const e = parseInt(stringValue.split('e-')[1]);
    if (e) {
      res = x * Math.pow(10, e - 1);
      return '0.' + new Array(e).join('0') + res.toString().substring(2);
    }
  } else {
    let e = parseInt(stringValue.split('+')[1]);
    if (e > 20) {
      e -= 20;
      res = x / Math.pow(10, e);
      return res + new Array(e + 1).join('0');
    }
  }
  return stringValue;
}
