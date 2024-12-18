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

print(f"Vector DB Script Location: {user_data_path}")
print(f"JSON File Path: {json_file_path}")
    # Read JSON from file
with open(json_file_path, 'r') as f:
    json_data = json.load(f)
    

try:
    # Initialize ChromaDB client with persistent storage
    persistent_dir = os.path.join(user_data_path, "vector_db")
    if not os.path.exists(persistent_dir):
        os.makedirs(persistent_dir)
    else:
        print(f"Persistent ChromaDB already exists at: {persistent_dir}")
        
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
        print(f"Created new collection: {collection_name}")
    else:
        collection = client.get_collection(collection_name)
        print(f"Retrieved existing collection: {collection_name}")

    # Print collection info
    print("\nCollection Details:")
    print(f"Name: {collection.name}")
    print(f"Count: {collection.count()}")

    # Print all collections
    all_collections = client.list_collections()
    print("\nAll Available Collections:")
    for coll in all_collections:
        print(f"- {coll.name}")

        # Debug: Print the structure before processing
    print("\nAttempting to process JSON data...")
        
    if not json_data:
        raise ValueError("No JSON data provided")
    docs_key = latest_run['vectorize_config']['documents']
    print('this is the length of the json data: ', len(json_data['content']))
    for index, obj in enumerate(json_data['content']):
        # Create ID by appending index to the run ID
        document_id = f"{latest_run['id']}-{index}"
        
        # Create metadata dictionary with run name and all obj keys except docs_key
        metadata = {"name": latest_run['name']}
        for key, value in obj.items():
            if key != docs_key and key != 'id':  # Skip the documents key
                metadata[key] = value

            if value == None:
                metadata[key] = 'None'
        
            
        collection.upsert(
            documents=[obj[docs_key]],
            ids=[document_id],
            metadatas=metadata
        )

    print(f"Added {len(json_data['content'])} documents to collection {collection_name}")

except Exception as e:
    print(f"Error initializing vector database: {str(e)}", file=sys.stderr)
    sys.exit(1)
