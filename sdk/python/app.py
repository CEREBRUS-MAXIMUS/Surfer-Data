from client import SurferClient
client = SurferClient()
result = client.get('imessage-001')
print("Got Bookmarks! ", result)