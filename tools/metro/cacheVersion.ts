import { createHash, type Hash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  createSourceFile,
  isIdentifier,
  isModuleBlock,
  isModuleDeclaration,
  isStringLiteral,
  isVariableStatement,
  ScriptTarget,
} from 'typescript';

const CONFIG_FILES = ['babel.config.js', 'metro.config.js', 'package.json', 'tsconfig.json', 'yarn.lock'];
const PATCH_DIRECTORIES = ['.yarn/patches', 'patches'];

/**
 * Identifies the configuration and environment used to transform JavaScript.
 *
 * Source contents remain Metro's responsibility. Recompute this value when
 * starting Metro after a configuration or environment change.
 */
export function getMetroCacheVersion(root: string, env: Readonly<Partial<NodeJS.ProcessEnv>> = process.env): string {
  const hash = createHash('sha256');
  hash.update('rainbow-metro-v1');
  const declarations = readFileSync(join(root, 'globals.d.ts'), 'utf8');
  hash.update(JSON.stringify(['globals.d.ts', declarations]));

  for (const file of CONFIG_FILES) hashFile(hash, root, file);
  for (const directory of PATCH_DIRECTORIES) hashDirectory(hash, root, directory);
  hashFile(hash, root, 'tools/metro/cacheVersion.ts');
  hashFile(hash, root, '.env');
  hashFile(hash, root, `.env.${env.BABEL_ENV || env.NODE_ENV || 'development'}`);

  hash.update(JSON.stringify([process.version, env.BABEL_ENV ?? null, env.NODE_ENV ?? null]));
  for (const name of getEnvironmentNames(declarations)) {
    hash.update(JSON.stringify([name, env[name] ?? null]));
  }
  return `rainbow-${hash.digest('hex')}`;
}

function getEnvironmentNames(declarations: string): string[] {
  const source = createSourceFile('globals.d.ts', declarations, ScriptTarget.Latest);
  const names: string[] = [];
  for (const statement of source.statements) {
    if (!isModuleDeclaration(statement) || !isStringLiteral(statement.name) || statement.name.text !== 'react-native-dotenv') continue;
    if (!statement.body || !isModuleBlock(statement.body)) throw new Error('Expected a react-native-dotenv module body in globals.d.ts');

    for (const member of statement.body.statements) {
      if (!isVariableStatement(member)) throw new Error('Expected named environment declarations in react-native-dotenv');
      for (const declaration of member.declarationList.declarations) {
        if (!isIdentifier(declaration.name)) throw new Error('Expected an environment variable name in react-native-dotenv');
        names.push(declaration.name.text);
      }
    }
  }
  if (!names.length) throw new Error('Missing react-native-dotenv declaration in globals.d.ts');
  return names.sort();
}

function hashFile(hash: Hash, root: string, path: string): void {
  let contents: Buffer;
  try {
    contents = readFileSync(join(root, path));
  } catch (error) {
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT') throw error;
    hash.update(JSON.stringify([path, null]));
    return;
  }
  hash.update(JSON.stringify([path, contents.length]));
  hash.update(contents);
}

function hashDirectory(hash: Hash, root: string, path: string): void {
  let entries;
  try {
    entries = readdirSync(join(root, path), { withFileTypes: true });
  } catch (error) {
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT') throw error;
    hash.update(JSON.stringify([path, null]));
    return;
  }
  entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const child = `${path}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Cache input must not be a symlink: ${child}`);
    if (entry.isDirectory()) hashDirectory(hash, root, child);
    else if (entry.isFile()) hashFile(hash, root, child);
  }
}
