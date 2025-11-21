import { StateValue } from 'xstate';

/**
 * Flattens an XState value into an ordered array of keys (Root -> Leaf).
 * Example: { settings: 'profile' } -> ['settings', 'settings.profile']
 */
export function resolveStatePaths(value: StateValue): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  const paths: string[] = [];
  const keys = Object.keys(value);

  if (keys.length === 0) return [];

  const parentKey = keys[0];
  paths.push(parentKey);

  const childValue = value[parentKey];
  const childPaths = resolveStatePaths(childValue);

  return paths.concat(childPaths.map((child) => `${parentKey}.${child}`));
}
