import chromadb
import sys
import os

folderpath = sys.argv[2]

print(folderpath)

print(os.path.join(folderpath))

client = chromadb.PersistentClient(path=os.path.join(folderpath))

print(client)

collection = client.get_or_create_collection("my_collection")

collection.add(
    documents=["This is a document"],
)