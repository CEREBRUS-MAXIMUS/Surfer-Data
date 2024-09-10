import { ChromaClient } from 'chromadb';

const client = new ChromaClient({
  path: 'http://localhost:8000',
});

export async function createCollection(name: string) {
  const collection = await client.createCollection({
    name: name,
  });
  return collection;
}