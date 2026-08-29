import { GRAPHS, type Graph } from './internal/cruise';

type RuleConfig = { name: string; from: Record<string, unknown>; to: Record<string, unknown> };
type Config = {
  forbidden: RuleConfig[];
  options: { tsPreCompilationDeps?: boolean | string; doNotFollow?: { path?: string } };
};

function loadConfig(graph: string): Config {
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
  const configs = Object.fromEntries(GRAPHS.map(graph => [graph, loadConfig(graph)])) as Record<Graph, Config>;
  const allRuleNames = GRAPHS.flatMap(graph => ruleNames(configs[graph]));

  it('assigns every rule to exactly one graph', () => {
    expect(new Set(allRuleNames).size).toBe(allRuleNames.length);
    for (const graph of GRAPHS) {
      expect(ruleNames(configs[graph]).length).toBeGreaterThan(0);
    }
  });

  it('rejects a graph name the runner does not know', () => {
    expect(() => loadConfig('typo')).toThrow(/Unknown DEPCRUISE_GRAPH/);
  });

  it('judges cycles on the compiled runtime graph, never the source graph', () => {
    expect(ruleNames(configs.runtime)).toContain('no-circular');
    expect(configs.source.forbidden.some(rule => rule.to.circular)).toBe(false);
    expect(configs.runtime.options.tsPreCompilationDeps).toBeUndefined();
  });

  it('follows node_modules only on the runtime graph', () => {
    expect('node_modules/react-native/index.js').not.toMatch(new RegExp(configs.runtime.options.doNotFollow?.path ?? '(?!)'));
    expect(configs.source.options.doNotFollow?.path).toBe('node_modules');
  });

  it('reads first-party source from the TypeScript AST so type imports are edges', () => {
    expect(configs.source.options.tsPreCompilationDeps).toBe(true);
  });

  it('keeps the node_modules rules on the runtime graph', () => {
    expect(ruleNames(configs.runtime)).toContain('no-dep-into-app-source');
    expect(ruleNames(configs.runtime).some(name => name.startsWith('no-untrusted-import-of-'))).toBe(true);
  });

  it('scopes layer rules to a file and its own module, in layered modules only', () => {
    const byName = Object.fromEntries(configs.source.forbidden.map(rule => [rule.name, rule]));
    const fromPath = (name: string) => new RegExp(byName[name].from.path as string);

    expect('src/features/token/core/services/erc20Calldata.ts').toMatch(fromPath('layer-core-is-a-leaf'));
    expect('src/framework/core/safeMath.ts').toMatch(fromPath('layer-core-is-a-leaf'));
    expect('src/features/token/data/api/erc20Read.ts').toMatch(fromPath('layer-data-does-not-import-ui'));
    expect('src/components/expanded-state/chart/core/x.ts').not.toMatch(fromPath('layer-core-is-a-leaf'));
    expect('src/features/token/ui/x.tsx').not.toMatch(fromPath('layer-core-is-a-leaf'));

    for (const rule of configs.source.forbidden.filter(r => r.name.startsWith('layer-'))) {
      expect(rule.to.path).toMatch(/^\^\$1\//);
    }
  });
});
