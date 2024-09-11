import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: 'lol',
  dangerouslyAllowBrowser: true,
});

export async function addDocuments(documents) {
    try {
        const response = await window.electron.ipcRenderer.invoke('add-document-to-vector-db', documents);
        console.log("response: ", response);
        return response;
    } catch (error) {
        console.error("Error adding document to vector DB:", error);
        throw error;
    }
}

export async function generateEmbedding(content) {
    const response = await openai.embeddings.create({
        input: content,
        model: "text-embedding-3-small"
    });
    return response.data[0].embedding;
}