class TrieNode<T> {
  children: { [key: string]: TrieNode<T> };
  data: T[];
  ids: Set<string>;

  constructor() {
    this.children = {};
    this.data = [];
    this.ids = new Set<string>();
  }
}

export class Trie<T> {
  private root: TrieNode<T>;

  constructor() {
    this.root = new TrieNode<T>();
  }

  // Insert a token into the trie and associate it with an object of type T
  insert(token: string, object: T, id: string): void {
    let node = this.root;
    for (const char of token) {
      if (!node.ids.has(id)) {
        node.data.push(object);
        node.ids.add(id);
      }
      if (!node.children[char]) {
        node.children[char] = new TrieNode<T>();
      }
      node = node.children[char];
    }
  }

  // Search for all objects that match a given query prefix
  search(query: string): T[] {
    let node = this.root;
    for (const char of query) {
      if (!node.children[char]) {
        return []; // No match found
      }
      node = node.children[char];
    }
    return node.data;
  }
}
