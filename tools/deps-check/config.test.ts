import { GRAPHS, type Graph } from './internal/cruise';

type RuleConfig = { name: string; from: { path?: string }; to: { path?: string; circular?: boolean } };
type Config = {
  forbidden: RuleConfig[];
  options: {
    tsPreCompilationDeps?: boolean | string;
    doNotFollow?: { path?: string };
    enhancedResolveOptions?: { extensions?: string[] };
  };
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

const configs = Object.fromEntries(GRAPHS.map(graph => [graph, loadConfig(graph)])) as Record<Graph, Config>;
const ruleNames = (config: Config) => config.forbidden.map(rule => rule.name);

function rule(graph: Graph, name: string): { from: RegExp; to: RegExp } {
  const found = configs[graph].forbidden.find(r => r.name === name);
  if (!found) throw new Error(`rule ${name} is not on the ${graph} graph`);
  return { from: new RegExp(found.from.path ?? '(?!)'), to: new RegExp(found.to.path ?? '(?!)') };
}

describe('.dependency-cruiser.cjs', () => {
  describe('graph selection', () => {
    it('assigns every rule to exactly one graph', () => {
      const all = GRAPHS.flatMap(graph => ruleNames(configs[graph]));
      expect(new Set(all).size).toBe(all.length);
    });

    it('gives every graph at least one rule', () => {
      for (const graph of GRAPHS) {
        expect(ruleNames(configs[graph]).length).toBeGreaterThan(0);
      }
    });

    it('rejects a graph name the runner does not know', () => {
      expect(() => loadConfig('typo')).toThrow(/Unknown DEPCRUISE_GRAPH/);
    });
  });

  describe('runtime graph', () => {
    it('reads compiled output, so type-only imports are not edges', () => {
      expect(configs.runtime.options.tsPreCompilationDeps).toBeUndefined();
    });

    it('follows into node_modules', () => {
      expect('node_modules/react-native/index.js').not.toMatch(new RegExp(configs.runtime.options.doNotFollow?.path ?? '(?!)'));
    });

    it('carries the cycle rule', () => {
      expect(ruleNames(configs.runtime)).toContain('no-circular');
    });

    it('carries the rules about edges originating inside dependencies', () => {
      expect(ruleNames(configs.runtime)).toContain('no-dep-into-app-source');
      expect(ruleNames(configs.runtime).some(name => name.startsWith('no-untrusted-import-of-'))).toBe(true);
    });
  });

  describe('source graph', () => {
    it('reads the TypeScript AST, so type-only imports are edges', () => {
      expect(configs.source.options.tsPreCompilationDeps).toBe(true);
    });

    it('records node_modules as leaves without following them', () => {
      expect(configs.source.options.doNotFollow?.path).toBe('node_modules');
    });

    it('never carries a cycle rule', () => {
      expect(configs.source.forbidden.some(r => r.to.circular)).toBe(false);
    });

    it('resolves extensionless imports that land on declaration files', () => {
      expect(configs.source.options.enhancedResolveOptions?.extensions).toContain('.d.ts');
    });

    describe('layer-core-is-a-leaf', () => {
      const { from, to } = rule('source', 'layer-core-is-a-leaf');

      it('applies to core/ of a layered feature', () => {
        expect('src/features/token/core/services/erc20Calldata.ts').toMatch(from);
      });

      it('applies to core/ of the framework', () => {
        expect('src/framework/core/safeMath.ts').toMatch(from);
      });

      it('ignores a legacy folder that happens to be named core/', () => {
        expect('src/components/expanded-state/chart/core/x.ts').not.toMatch(from);
      });

      it('does not apply to other layers', () => {
        expect('src/features/token/ui/x.tsx').not.toMatch(from);
        expect('src/features/token/data/api/erc20Read.ts').not.toMatch(from);
      });

      it('forbids imports into ui/ and data/ of any layered module', () => {
        expect('src/features/wallet/data/stores/walletStore.ts').toMatch(to);
        expect('src/framework/ui/components/Emoji.tsx').toMatch(to);
      });

      it('allows imports into core/', () => {
        expect('src/features/wallet/core/walletLibrary.ts').not.toMatch(to);
      });

      it('does not classify legacy directories as layers', () => {
        expect('src/components/ui/x.tsx').not.toMatch(to);
      });
    });

    describe('layer-data-does-not-import-ui', () => {
      const { from, to } = rule('source', 'layer-data-does-not-import-ui');

      it('applies to data/ of a layered module', () => {
        expect('src/features/token/data/api/erc20Read.ts').toMatch(from);
        expect('src/framework/data/http/x.ts').toMatch(from);
      });

      it('does not apply to other layers', () => {
        expect('src/features/token/core/services/erc20Calldata.ts').not.toMatch(from);
        expect('src/features/token/ui/x.tsx').not.toMatch(from);
      });

      it('forbids imports into ui/ of any layered module', () => {
        expect('src/features/wallet/ui/x.tsx').toMatch(to);
        expect('src/framework/ui/components/Emoji.tsx').toMatch(to);
      });

      it('allows imports into data/ and core/', () => {
        expect('src/features/wallet/data/stores/walletStore.ts').not.toMatch(to);
        expect('src/features/wallet/core/walletLibrary.ts').not.toMatch(to);
      });
    });
    describe('layer-ui-runtime-only-in-ui', () => {
      const { from, to } = rule('source', 'layer-ui-runtime-only-in-ui');

      it('applies to core/ and data/ of layered modules', () => {
        expect('src/features/token/core/services/erc20Calldata.ts').toMatch(from);
        expect('src/features/wallet/data/stores/walletStore.ts').toMatch(from);
        expect('src/framework/data/http/x.ts').toMatch(from);
      });

      it('does not apply to ui/ or to legacy directories', () => {
        expect('src/features/token/ui/x.tsx').not.toMatch(from);
        expect('src/components/x/core/y.ts').not.toMatch(from);
      });

      it('forbids the UI runtime packages', () => {
        expect('node_modules/react/index.js').toMatch(to);
        expect('node_modules/react-native/index.js').toMatch(to);
        expect('node_modules/react-native-reanimated/src/index.ts').toMatch(to);
      });

      it('leaves unrelated packages alone, including react-prefixed ones', () => {
        expect('node_modules/react-native-mmkv/lib/index.js').not.toMatch(to);
        expect('node_modules/viem/index.ts').not.toMatch(to);
      });
    });

    describe('layer-core-has-no-state', () => {
      const { from, to } = rule('source', 'layer-core-has-no-state');

      it('applies to core/ of layered modules only', () => {
        expect('src/features/token/core/services/erc20Calldata.ts').toMatch(from);
        expect('src/framework/core/safeMath.ts').toMatch(from);
        expect('src/features/token/data/api/erc20Read.ts').not.toMatch(from);
      });

      it('forbids store creators and the legacy state and query layers', () => {
        expect('node_modules/@storesjs/stores/dist/index.js').toMatch(to);
        expect('src/state/wallets/walletsStore.ts').toMatch(to);
        expect('src/react-query/queryClient.ts').toMatch(to);
        expect('src/redux/store.ts').toMatch(to);
      });
    });
  });
});
