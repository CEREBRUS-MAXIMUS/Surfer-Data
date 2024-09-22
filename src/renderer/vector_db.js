import { openDB } from "idb";
import OpenAI from "openai";
import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';
import app from "../firebase";
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = await window.electron.ipcRenderer.invoke('get-supabase-url');
const supabaseAnonKey = await window.electron.ipcRenderer.invoke('get-supabase-anon-key');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function addToSupabase(chunks, company, name) {
    const local_db = await openDB('vectorDB', 1, {
      upgrade(db) {
        db.createObjectStore('documents', {
          keyPath: 'chunk_id',
        });
      },
    });
    
    const uid = app.auth().currentUser.uid;
    const batchSize = 1000;

    for (let i = 0; i < chunks.length; i += batchSize) {
        const chunkBatch = chunks.slice(i, i + batchSize);
        const embeddings = await createEmbeddings(chunkBatch);

        // Prepare documents for local storage and Supabase
        const documents = chunkBatch.map((chunk, index) => {
            const chunk_id = uuidv4();
            console.log('chunk id type: ', typeof chunk_id);
            return {
                chunk_id,
                company,
                name,
                content: chunk
            };
        });

        // Store in local IndexedDB
        const tx = local_db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');
        for (const doc of documents) {
            await store.put(doc);
        }
        await tx.done;

        // Prepare cloud documents using the same chunk_id
        const cloudDocuments = documents.map((doc, index) => ({
            firebase_id: uid,
            chunk_id: doc.chunk_id,
            company,
            name,
            vector: embeddings.data[index].embedding
        }));
 
        // Store in Supabase
        const { data, error } = await supabase
            .from('surfer_data')
            .insert(cloudDocuments);

        if (error) {
            console.error('Error inserting data into Supabase:', error);
            throw error;
        }
    }

    console.log('All chunks added to local DB and Supabase successfully');
}

export async function supabaseSearch(query) {
  // Get query embedding
  const queryEmbedding = await createEmbeddings([query]);
  const queryVector = queryEmbedding.data[0].embedding;

  // Get the current user's Firebase ID
  const uid = app.auth().currentUser.uid;

  const { data, error } = await supabase.rpc('get_similar_docs', {
    p_vector: queryVector,
    p_firebase_id: uid,
  });

  if (error) {
    console.error('Error calling similar_documents:', error);
    throw error;
  }

  // Open local IndexedDB
  const local_db = await openDB('vectorDB', 1);
  const store = local_db.transaction('documents').objectStore('documents');

  // Fetch local data for matching chunk_ids
  const localResults = await Promise.all(
    data.map(async (item) => {
      const localDoc = await store.get(item.chunk_id);
      return { ...item, content: localDoc ? localDoc.content : null };
    })
  );

  console.log('Similarity search results with local content:', localResults);
  return localResults;
} 

// export async function searchSupabase(query) {
//   const { data, error } = await supabase
//     .from('surfer_data')
//     .select('*')
//     .textSearch('content', query);
//   return data;
// }

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