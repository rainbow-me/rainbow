export default function simplifyData(data, pickRange = 10, includeExtremes = true) {
  if (!data) {
    return [];
  }
  let min = -1;
  let max = -1;
  if (includeExtremes) {
    min = 0;
    max = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[min].y > data[i].y) {
        min = i;
      }

      if (data[max].y < data[i].y) {
        max = i;
      }
    }
  }

  return data.filter((_, i) => i % pickRange === 0 || i === min || i === max || i === 0 || i === data.length - 1);
}
