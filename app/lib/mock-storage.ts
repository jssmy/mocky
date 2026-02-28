import { promises as fs } from "fs";
import path from "path";
import type { MockCollection, MockDefinition } from "../components/postman/interfaces/mock-definition.interface";

const DATA_DIR = path.join(process.cwd(), "data");
const MOCKS_FILE = path.join(DATA_DIR, "mocks.json");

export interface MockStorage {
  collections: MockCollection[];
  updatedAt: number;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readMockStorage(): Promise<MockStorage> {
  await ensureDataDir();
  
  try {
    const content = await fs.readFile(MOCKS_FILE, "utf-8");
    return JSON.parse(content) as MockStorage;
  } catch {
    const initial: MockStorage = {
      collections: [],
      updatedAt: Date.now(),
    };
    await writeMockStorage(initial);
    return initial;
  }
}

export async function writeMockStorage(storage: MockStorage): Promise<void> {
  await ensureDataDir();
  storage.updatedAt = Date.now();
  await fs.writeFile(MOCKS_FILE, JSON.stringify(storage, null, 2), "utf-8");
}

export async function getAllMocks(): Promise<MockDefinition[]> {
  const storage = await readMockStorage();
  return storage.collections.flatMap((collection) => collection.mocks);
}

export async function findMatchingMock(
  method: string,
  pathname: string,
  queryParams: URLSearchParams,
  headers: Headers,
): Promise<MockDefinition | null> {
  const mocks = await getAllMocks();
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  // Filter enabled mocks that match method and path
  const candidates = mocks.filter((mock) => {
    if (!mock.enabled) return false;
    if (mock.method.toUpperCase() !== normalizedMethod) return false;
    
    // Normalize mock path
    const mockPath = mock.path.startsWith("/") ? mock.path : `/${mock.path}`;
    
    // Exact path match or pattern match (simple :param support)
    if (mockPath === normalizedPath) return true;
    
    // Support simple path params like /users/:id
    const mockSegments = mockPath.split("/");
    const pathSegments = normalizedPath.split("/");
    
    if (mockSegments.length !== pathSegments.length) return false;
    
    return mockSegments.every((seg, i) => {
      if (seg.startsWith(":")) return true; // Path param matches anything
      return seg === pathSegments[i];
    });
  });

  if (candidates.length === 0) return null;

  // Score candidates by how well their params/headers match
  let bestMatch: MockDefinition | null = null;
  let bestScore = -1;

  for (const mock of candidates) {
    let score = 0;
    let isValid = true;

    // Check required params match
    const enabledParams = mock.matchParams.filter((p) => p.enabled && p.key.trim());
    for (const param of enabledParams) {
      const queryValue = queryParams.get(param.key);
      if (queryValue === param.value) {
        score += 10;
      } else if (queryValue === null || queryValue !== param.value) {
        isValid = false;
        break;
      }
    }

    if (!isValid) continue;

    // Check required headers match
    const enabledHeaders = mock.matchHeaders.filter((h) => h.enabled && h.key.trim());
    for (const header of enabledHeaders) {
      const headerValue = headers.get(header.key);
      if (headerValue?.toLowerCase() === header.value.toLowerCase()) {
        score += 10;
      } else if (headerValue === null || headerValue.toLowerCase() !== header.value.toLowerCase()) {
        isValid = false;
        break;
      }
    }

    if (!isValid) continue;

    // More specific mocks (more matching criteria) get higher priority
    score += enabledParams.length + enabledHeaders.length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = mock;
    }
  }

  return bestMatch;
}
