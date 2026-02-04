import { resolveURI } from '../utils';

export default class URI {
  getMetadata(uri: string) {
    const { uri: resolvedURI } = resolveURI(uri);
    return { image: resolvedURI };
  }
}
