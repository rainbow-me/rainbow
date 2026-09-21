import { getSportsNavigationRoot, getSportsParentDestination, type SportsDestination } from './browse';
import { SportsCatalog } from './generated/sports';

const catalog = SportsCatalog.fromJSON({
  sports: [
    { id: 'soccer', competitions: [{ id: 'epl' }] },
    { id: 'esports', competitions: [{ id: 'lol' }] },
    { id: 'tennis', competitions: [{ id: 'us-open' }, { id: 'atp' }] },
    { id: 'basketball', competitions: [{ id: 'nba' }] },
  ],
  prominentScopeIds: ['nba', 'soccer', 'esports', 'us-open'],
});
const more: SportsDestination = { type: 'all' };
const scope = (scopeId: string): SportsDestination => ({ type: 'scope', scopeId });

describe('Sports navigation', () => {
  it('returns through the category hierarchy while retaining More as the entry', () => {
    expect(getSportsNavigationRoot(catalog, more)).toEqual(more);
    expect(getSportsParentDestination(catalog, scope('epl'), more)).toEqual(scope('soccer'));
    expect(getSportsParentDestination(catalog, scope('soccer'), more)).toEqual(more);
    expect(getSportsParentDestination(catalog, more, more)).toBeUndefined();
  });

  it('keeps a featured sport selected while opening its competition', () => {
    expect(getSportsNavigationRoot(catalog, scope('esports'))).toEqual(scope('esports'));
    expect(getSportsParentDestination(catalog, scope('lol'), scope('esports'))).toEqual(scope('esports'));
    expect(getSportsParentDestination(catalog, scope('esports'), scope('esports'))).toBeUndefined();
  });

  it('opens featured competitions directly without inserting their parent into the path', () => {
    for (const scopeId of ['nba', 'us-open']) {
      const destination = scope(scopeId);
      expect(getSportsNavigationRoot(catalog, destination)).toEqual(destination);
      expect(getSportsParentDestination(catalog, destination, destination)).toBeUndefined();
    }
  });

  it('anchors unfeatured Live or search results to a featured parent or More', () => {
    expect(getSportsNavigationRoot(catalog, scope('lol'))).toEqual(scope('esports'));
    expect(getSportsParentDestination(catalog, scope('lol'), scope('lol'))).toEqual(scope('esports'));
    expect(getSportsNavigationRoot(catalog, scope('tennis'))).toEqual(more);
    expect(getSportsParentDestination(catalog, scope('tennis'), scope('tennis'))).toEqual(more);
    expect(getSportsNavigationRoot(catalog, scope('atp'))).toEqual(more);
    expect(getSportsParentDestination(catalog, scope('atp'), scope('atp'))).toEqual(scope('tennis'));
    expect(getSportsParentDestination(catalog, scope('tennis'), scope('atp'))).toEqual(more);
  });

  it('resolves an entry against the catalog when it becomes available', () => {
    const destination = scope('lol');
    expect(getSportsNavigationRoot(undefined, destination)).toEqual(destination);
    expect(getSportsNavigationRoot(catalog, destination)).toEqual(scope('esports'));
  });
});
