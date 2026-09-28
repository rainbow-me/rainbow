import { vi } from 'vitest';

const { mockFirestoreDocuments } = vi.hoisted(() => ({ mockFirestoreDocuments: new Map<string, unknown>() }));

vi.mock('@react-native-firebase/app', () => ({ getApp: () => undefined }));
vi.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => undefined,
  collection: (_database: unknown, path: string) => path,
  doc: (_database: unknown, collection: string, id: string) => `${collection}/${id}`,
  query: (collection: string, ...constraints: unknown[]) => ({ collection, constraints }),
  where: (field: string, operator: string, value: unknown) => ({ field, operator, value }),
  getDoc: async (path: string) => ({ data: () => mockFirestoreDocuments.get(path) }),
  getDocs: vi.fn(async ({ collection }: { collection: string }) => ({
    docs: [...mockFirestoreDocuments]
      .filter(([path]) => path.startsWith(`${collection}/`))
      .map(([path, data]) => ({
        id: path.slice(collection.length + 1),
        data: () => data,
      })),
  })),
}));

export { mockFirestoreDocuments };
