import { openDB } from "idb";
import OpenAI from "openai";
import Typesense from 'typesense';

export async function addToTypesense(chunks, company, name, runID) {
    const key = 'lol'; // await window.electron.ipcRenderer.invoke('get-typesense-api-key');
  const typesenseClient = new Typesense.Client({
    nodes: [
      {
        host: 'xrgzqa67ylpk9vmjp-1.a1.typesense.net',
        port: 443,
        protocol: 'https',
      },
    ],
    apiKey: key,
  });

    const collections = await typesenseClient.collections().retrieve();
    
    if (!collections.some(collection => collection.name === 'surfer_data')) {
        const dataSchema = {
            name: 'surfer_data',
            fields: [
                { name: 'company', type: 'string', facet: true },
                { name: 'name', type: 'string', facet: true },
                { name: 'runID', type: 'string', facet: true },
                { name: 'added_to_db', type: 'int64', facet: true },
                { name: 'content', type: 'string' },
                { name: 'embedding', type: 'float[]', embed: { from: ['content'], model_config: { model_name: 'ts/all-MiniLM-L12-v2' } } }
            ],
            default_sorting_field: 'added_to_db',
            enable_nested_fields: true,
        };
        
        await typesenseClient.collections().create(dataSchema);
    }

    const documents = chunks.map(chunk => ({
        company,
        name,
        runID,
        added_to_db: Date.now(),
        content: chunk,
    }));

    await typesenseClient.collections('surfer_data').documents().import(documents, { action: 'upsert' });


    // schema for each doc in collection:
    //  {
    //     company,
    //     name,
    //     runID,
    //     timestamp: Date.now(),
    //     content: {
    //         // object w diff keys depending on platform
    //     },
    // }

    // add chunks to collection (split up array)

}

export async function searchTypesense(query) {
    const key = 'lol';
    const typesenseClient = new Typesense.Client({
        nodes: [
            { host: 'xrgzqa67ylpk9vmjp-1.a1.typesense.net', port: 443, protocol: 'https' },
        ],
        apiKey: key,
    });



    const results = await typesenseClient.collections('surfer_data').documents().search({
        q: query,
        query_by: 'embedding',
        vector_query: 'embedding([], k: 5)',
    });

    console.log('results: ', results);
    return results;
}

export async function addDocuments(chunks, company, name, runID, folderPath) {
    const db = await openDB('vectorDB', 1, {
        upgrade(db) {
            const documentStore = db.createObjectStore('documents', {
                autoIncrement: true,
                keyPath: 'id',
            });
        },
    });

    const batchSize = 1000;
    for (let i = 0; i < chunks.length; i += batchSize) {
        const chunkBatch = chunks.slice(i, i + batchSize);
        const embeddings = await createEmbeddings(chunkBatch);

        const documents = chunkBatch.map((chunk, index) => ({
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

        await addBatchToDB(db, documents);
    }

}

async function addBatchToDB(db, documents) {
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    for (const doc of documents) {
        await store.put(doc);
    }
    console.log('documents added to DB: ', documents);
    await tx.done;
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
    
    console.log('embeddings: ', embeddings);
    return embeddings;
}

async function getAll() {
    const db = await openDB('vectorDB', 1);
    const store = db.transaction('documents').objectStore('documents');
    return await store.getAll();
}

export async function similaritySearch(query) {
    const db = await openDB('vectorDB', 1, {
      upgrade(db) {
        const documentStore = db.createObjectStore('documents', {
          autoIncrement: true,
          keyPath: 'id',
        });
      },
    });

    const store = db.transaction('documents').objectStore('documents');

    // Get query embedding
    const queryEmbedding = await createEmbeddings([query]);
    const queryVector = queryEmbedding.data[0].embedding;

    // Get all documents
    const allDocs = await getAll();

    // Calculate similarity scores using cosine similarity
    const scoresPairs = allDocs.map(doc => {
        const score = cosineSimilarity(doc.vector, queryVector);
        return [doc, score];
    });

    // Sort by score and get top k results
    const sortedPairs = scoresPairs.sort((a, b) => b[1] - a[1]);
    const results = sortedPairs.slice(0, 5).map(pair => ({
        ...pair[0],
        score: pair[1] // Cosine similarity is already normalized between -1 and 1
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

// Helper function for cosine similarity
function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// ... existing code ...