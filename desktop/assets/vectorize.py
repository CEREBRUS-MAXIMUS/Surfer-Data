import chromadb
import os
import sys
from chromadb.utils import embedding_functions
import json
import uuid
import base64

embedding_function = embedding_functions.DefaultEmbeddingFunction

    # Print script location
user_data_path = sys.argv[1]
json_file_path = sys.argv[2]
latest_run_base64 = sys.argv[3]

# Decode the base64 string back to JSON
latest_run = json.loads(base64.b64decode(latest_run_base64).decode('utf-8'))
platform_id = latest_run['platformId']

    # Read JSON from file
with open(json_file_path, 'r') as f:
    json_data = json.load(f)
    

try:
    # Initialize ChromaDB client with persistent storage
    persistent_dir = os.path.join(user_data_path, "vector_db")
    if not os.path.exists(persistent_dir):
        os.makedirs(persistent_dir)

    
        
    client = chromadb.PersistentClient(path=persistent_dir)
        
    # Create or get collection
    collection_name = "surfer_collection"
    existing_collections = client.list_collections()
    collection_exists = any(coll.name == collection_name for coll in existing_collections)

    if not collection_exists:
        collection = client.create_collection(
            name=collection_name,
            metadata={"description": "Main collection for Surfer data"}
        )
        
    else:
        collection = client.get_collection(collection_name)
    

    # Print all collections
    all_collections = client.list_collections()

    if not json_data:
        raise ValueError("No JSON data provided")
    
    docs_key = latest_run['vectorize_config']['documents']
    
    total_items = len(json_data['content'])
    print(f"progress:{platform_id}:0/{total_items}", flush=True)
    
    for index, obj in enumerate(json_data['content']):
        # Add validation for required keys
        if docs_key not in obj:
            print(f"Warning: Document at index {index} missing required key '{docs_key}'. Skipping.", flush=True)
            continue
            
        document_id = f"{latest_run['id']}-{index}"
        
        # Create metadata dictionary
        metadata = {"name": latest_run['name']}
        for key, value in obj.items():
            if key != docs_key and key != 'id':
                if isinstance(value, dict):
                    metadata[key] = json.dumps(value)
                elif value is None:
                    metadata[key] = 'None'
                else:
                    metadata[key] = str(value)  # Convert all values to strings
        
        # Ensure the document content is a string
        document_content = obj[docs_key]
        if not isinstance(document_content, str):
            document_content = str(document_content)
        
        # Chunk the document content
        docs_key_chunks = [document_content[i:i+1000] for i in range(0, len(document_content), 1000)]

        for chunk in docs_key_chunks:
            collection.upsert(
                documents=[chunk],
                ids=[document_id],
                metadatas=[metadata]  # Fix: Pass metadata as a list
            )
        
        print(f"progress:{platform_id}:{index + 1}/{total_items}", flush=True)
    
    print(f"progress:{platform_id}:{total_items}/{total_items}", flush=True)

except Exception as e:
    print(f"Error initializing vector database: {str(e)}", file=sys.stderr)
    print(f"Full error details:", str(e.__class__.__name__), str(e), file=sys.stderr)
    sys.exit(1)
