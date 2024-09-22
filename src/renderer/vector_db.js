import { openDB } from "idb";
import OpenAI from "openai";
import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';
import app from "../firebase";
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = await window.electron.ipcRenderer.invoke('get-supabase-url');
const supabaseAnonKey = await window.electron.ipcRenderer.invoke('get-supabase-anon-key');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function addDocuments(chunks, company, name) {
    const local_db = await openDB('vectorDB', 1, {
      upgrade(db) {
        db.createObjectStore('documents', {
          keyPath: 'chunk_id',
        });
      },
    });
    
    const uid = app.auth().currentUser.uid;
    const batchSize = 1000; // Increased batch size
    const maxRetries = 3;
    const maxConcurrentBatches = 5; // Adjust based on your system's capabilities

    for (let i = 0; i < chunks.length; i += batchSize * maxConcurrentBatches) {
        const batchPromises = [];

        for (let j = 0; j < maxConcurrentBatches; j++) {
            const start = i + j * batchSize;
            const end = start + batchSize;
            if (start < chunks.length) {
                batchPromises.push(processBatch(chunks.slice(start, end), company, name, uid, maxRetries));
            }
        }

        await Promise.all(batchPromises);
    }

    console.log('All chunks added to local DB and Supabase successfully');
}

async function processBatch(chunkBatch, company, name, uid, maxRetries) {
    const embeddings = await createEmbeddings(chunkBatch);

    const documents = chunkBatch.map((chunk, index) => {
        const chunk_id = uuidv4();
        return {
            chunk_id,
            company,
            name,
            content: chunk
        };
    });

    await storeInLocalDB(await openDB('vectorDB', 1), documents);

    const cloudDocuments = documents.map((doc, index) => ({
        firebase_id: uid,
        chunk_id: doc.chunk_id,
        company,
        name,
        vector: embeddings.data[index].embedding
    }));

    await storeInSupabaseWithRetry(cloudDocuments, maxRetries);
}

async function storeInLocalDB(local_db, documents) {
    console.log('Storing batch in local db');
    const tx = local_db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    for (const doc of documents) {
        await store.put(doc);
    }
    await tx.done;
    console.log('Successfully stored in local db');
}

async function storeInSupabaseWithRetry(cloudDocuments, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Storing in Supabase (attempt ${attempt})`);
            const { data, error } = await supabase
                .from('surfer_data')
                .upsert(cloudDocuments);

            if (error) {
                throw error;
            }

            console.log('Successfully stored in Supabase');
            return;
        } catch (error) {
            console.error(`Error inserting data into Supabase (attempt ${attempt}):`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
    }
}

export async function similaritySearch(query, platformName = null) {
  // Get query embedding
  const queryEmbedding = await createEmbeddings([query]);
  const queryVector = queryEmbedding.data[0].embedding;

  // Get the current user's Firebase ID
  const uid = app.auth().currentUser.uid;

  // Prepare the parameters for the RPC call 
  let rpcParams = {
    p_vector: queryVector,
    p_firebase_id: uid,
    p_num_docs: 7
  };

  // Only add p_name if platformName is not null
  if (platformName !== null) {
    rpcParams.p_name = platformName;
  }

  let { data, error } = await supabase.rpc('get_similar_docs', rpcParams);

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


async function addBatchToDB(db, documents) {
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    for (const doc of documents) {
        await store.put(doc);
    }
    console.log('documents added to DB: ', documents);
    await tx.done;
}


async function createEmbeddings(chunks) {
    const apiKey = await window.electron.ipcRenderer.invoke('get-openai-api-key');
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    
    const embeddings = await client.embeddings.create({
        input: chunks,
        model: 'text-embedding-3-small',
        dimensions: 256
    });
    
    console.log('embeddings: ', embeddings);
    return embeddings;
}