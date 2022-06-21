const reduceArrayToObject = (item: any, culm: any) => Object.assign(culm, item);

export default (array: any) =>
  Array.isArray(array)
    ? array.filter(el => el).reduce(reduceArrayToObject, {})
    : array;
