export default queryString => {
  const result = {};

  const pairs = (queryString[0] === '?'
    ? queryString.substr(1)
    : queryString
  ).split('&');

  for (let i = 0; i < pairs.length; i++) {
    const keyArr = pairs[i].match(/\w+(?==)/i) || [];
    const valueArr = pairs[i].match(/=.+/i) || [];
    if (keyArr[0]) {
      result[decodeURIComponent(keyArr[0])] = decodeURIComponent(
        valueArr[0].substr(1)
      );
    }
  }
  return result;
};
