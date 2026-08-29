import { GRAPHS, type Graph } from './internal/cruise';

type RuleConfig = { name: string; to: Record<string, unknown> };
type Config = {
  forbidden: RuleConfig[];
  options: { tsPreCompilationDeps?: boolean | string; doNotFollow?: { path?: string } };
};

function loadConfig(graph: Graph): Config {
  const previous = process.env.DEPCRUISE_GRAPH;
  process.env.DEPCRUISE_GRAPH = graph;
  try {
    let config: Config | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      config = require('../../.dependency-cruiser.cjs') as Config;
    });
    if (!config) throw new Error('config did not load');
    return config;
  } finally {
    if (previous === undefined) delete process.env.DEPCRUISE_GRAPH;
    else process.env.DEPCRUISE_GRAPH = previous;
  }
}

const ruleNames = (config: Config) => config.forbidden.map(rule => rule.name);

describe('.dependency-cruiser.cjs graphs', () => {
  const firstParty = loadConfig('first-party');
  const thirdParty = loadConfig('third-party');

  it('assigns every rule to exactly one graph', () => {
    const first = ruleNames(firstParty);
    const third = ruleNames(thirdParty);
    expect(first.filter(name => third.includes(name))).toEqual([]);
    expect(first.length + third.length).toBeGreaterThan(0);
  });

  it('cruises first-party code from the TypeScript AST without descending into node_modules', () => {
    expect(firstParty.options.tsPreCompilationDeps).toBe(true);
    expect(firstParty.options.doNotFollow?.path).toBe('node_modules');
  });

  it('follows node_modules for the third-party graph on the post-compilation extractor', () => {
    expect(thirdParty.options.tsPreCompilationDeps).toBeUndefined();
    expect('node_modules/react-native/index.js').not.toMatch(new RegExp(thirdParty.options.doNotFollow?.path ?? '(?!)'));
  });

  it('judges cycles on runtime edges only', () => {
    const noCircular = firstParty.forbidden.find(rule => rule.name === 'no-circular');
    expect(noCircular?.to).toMatchObject({ circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } });
  });

  it('keeps the node_modules rules on the third-party graph', () => {
    expect(ruleNames(thirdParty)).toEqual(expect.arrayContaining(['no-dep-into-app-source']));
    expect(ruleNames(thirdParty).some(name => name.startsWith('no-untrusted-import-of-'))).toBe(true);
  });

  it('lists both graphs for the runner', () => {
    expect([...GRAPHS].sort()).toEqual(['first-party', 'third-party']);
  });
});
