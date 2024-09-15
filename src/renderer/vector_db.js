import { openDB } from "idb";
import OpenAI from "openai";

export async function addDocuments(chunks, company, name, runID, folderPath) {
    const db = await openDB('vectorDB', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('documents')) {
                const documentStore = db.createObjectStore('documents', {
                    autoIncrement: true,
                    keyPath: 'id',
                });
                documentStore.createIndex('text', 'text');
                documentStore.createIndex('timestamp', 'timestamp');
                documentStore.createIndex('vector', 'vector');
                documentStore.createIndex('vectorMag', 'vectorMag');
                documentStore.createIndex('hits', 'hits');
            }
        },
    });


    const embeddings = await createEmbeddings(chunks);

    // Map chunks and embeddings together
    const documents = chunks.map((chunk, index) => ({
        runID,
        company,
        name,
        folderPath,
        content: chunk,
        vector: embeddings.data[index].embedding,
        vectorMag: calculateMagnitude(embeddings.data[index].embedding),
        timestamp: Date.now(),
        hits: 0,
    }));

      documents.map(async (doc) => {
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');
        await store.put(doc);
        await tx.done;
      })

    return documents;
}

// Helper function to calculate vector magnitude
function calculateMagnitude(vector) {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

async function createEmbeddings(chunks) {
    const apiKey = await window.electron.ipcRenderer.invoke('get-openai-api-key');

    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const embeddings = await client.embeddings.create({
        input: chunks,
        model: 'text-embedding-3-small',

    });

    return embeddings;
}

async function getAll() {
    const db = await openDB('vectorDB', 1);
    const store = db.transaction('documents').objectStore('documents');
    return await store.getAll();
}

export async function similaritySearch(query) {
    const db = await openDB('vectorDB', 1);
    const store = db.transaction('documents').objectStore('documents');

    // Get query embedding
    const queryEmbedding = await createEmbeddings([query]);
    const queryVector = queryEmbedding.data[0].embedding;
    const queryMagnitude = calculateMagnitude(queryVector);

    // Get all documents
    const allDocs = await getAll();

    // Calculate similarity scores
    const scoresPairs = allDocs.map(doc => {
        const dotProduct = doc.vector.reduce((sum, val, i) => sum + val * queryVector[i], 0);
        const score = dotProduct / (doc.vectorMag * queryMagnitude);
        return [doc, score];
    });

    // Sort by score and get top k results
    const sortedPairs = scoresPairs.sort((a, b) => b[1] - a[1]);
    const results = sortedPairs.slice(0, 5).map(pair => ({
        ...pair[0],
        score: (pair[1] + 1) / 2 // Normalize score
    }));

    // Update hit counters
    const tx = db.transaction('documents', 'readwrite');
    const updateStore = tx.objectStore('documents');
    for (const result of results) {
        result.hits = (result.hits || 0) + 1;
        await updateStore.put(result);
    }
    await tx.done;
    console.log('results: ', results);
    return results;
}

// ... existing code ...