export const filterList = (list, searchPhrase, searchParameter = false, separator = ' ') => {
  const filteredList = [];
  if (list && searchPhrase.length > 0) {
    for (let i = 0; i < list.length; i++) {
      let searchedItem = searchParameter ? list[i][searchParameter] : list[i];
      const splitedWordList = (searchedItem || '').split(separator);
      splitedWordList.push(searchedItem);
      for (let j = 0; j < splitedWordList.length; j++) {
        if (splitedWordList[j].toLowerCase().startsWith(searchPhrase.toLowerCase())) {
          filteredList.push(list[i]);
          break;
        }
      }
    }
  } else {
    return list;
  }
  return filteredList;
}
