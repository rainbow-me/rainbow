import { favoriteDappsStore } from '.';

describe('FavoriteDappsStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    favoriteDappsStore.setState(
      {
        favoriteDapps: [],
      },
      true
    ); // The second argument 'true' is to replace the state instead of merging
  });

  test('should be able to add a favorite site', () => {
    const { addFavorite } = favoriteDappsStore.getState();
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(0);
    addFavorite({
      name: 'Uniswap',
      url: 'uniswap.org',
      image: 'uniswap.org/favicon',
    });
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(1);
  });

  test('adding a duplicate favorite site should not increase the array', () => {
    const { addFavorite } = favoriteDappsStore.getState();
    addFavorite({
      name: 'Zora',
      url: 'zora.co',
      image: 'zora.png',
    });
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(1);
    addFavorite({
      name: 'Zora',
      url: 'zora.co',
      image: 'zora.png',
    });
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(1);
  });

  test('should be able to remove a favorite site', () => {
    const { addFavorite, removeFavorite } = favoriteDappsStore.getState();
    addFavorite({
      name: 'Mint.fun',
      url: 'mint.fun',
      image: 'mint.fun/favicon',
    });
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(1);
    removeFavorite('mint.fun');
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(0);
  });

  test('removing a non-existent favorite site should do nothing', () => {
    const { removeFavorite } = favoriteDappsStore.getState();
    removeFavorite('https://nonexistentdapp.com');
    expect(favoriteDappsStore.getState().favoriteDapps.length).toBe(0);
  });

  test('should be able to check if a site is a favorite', () => {
    const { addFavorite, isFavorite } = favoriteDappsStore.getState();
    addFavorite({
      name: 'Uniswap',
      url: 'uniswap.org',
      image: 'uniswap.org/favicon',
    });
    expect(isFavorite('uniswap.org')).toBe(true);
    expect(isFavorite('notafavorite.org')).toBe(false);
  });
});
