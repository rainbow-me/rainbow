// Documents cross the same unknown-data boundary as Firestore snapshots.
export const mockFirestoreDocuments = new Map<string, unknown>();

jest.mock('@react-native-firebase/app', () => ({ getApp: () => undefined }));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => undefined,
  collection: (_database: unknown, path: string) => path,
  doc: (_database: unknown, collection: string, id: string) => `${collection}/${id}`,
  query: (collection: string) => collection,
  where: () => undefined,
  getDoc: async (path: string) => ({ data: () => mockFirestoreDocuments.get(path) }),
  getDocs: async (collection: string) => ({
    docs: [...mockFirestoreDocuments]
      .filter(([path]) => path.startsWith(`${collection}/`))
      .map(([path, data]) => ({
        id: path.slice(collection.length + 1),
        data: () => data,
      })),
  }),
}));
