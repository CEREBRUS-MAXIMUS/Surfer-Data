import networkx as nx
from pyvis.network import Network
import matplotlib.pyplot as plt
import time
from surfer_protocol import SurferClient
from llm import extract_nodes, extract_edges
import json
from datetime import datetime

surfer_client = SurferClient()
data = surfer_client.get('bookmarks-001')

# Initialize both NetworkX and Pyvis graphs
G = nx.Graph()
net = Network(height="750px", width="100%", bgcolor="#ffffff", font_color="black")
net.toggle_physics(True)
plt.figure(figsize=(15, 10))

def display_graph(G, title):
    # Update Pyvis network
    net.from_nx(G)
    
    # Configure node and edge appearance
    for node in net.nodes:
        node.update({
            'size': 25,
            'label': G.nodes[node['id']].get('label', ''),
            'title': G.nodes[node['id']].get('text', ''),  # Hover text
            'color': '#6AACF0'
        })
    
    for edge in net.edges:
        edge.update({
            'label': G.edges[edge['from'], edge['to']].get('label', ''),
            'width': 2,
            'font': {'size': 10}
        })
    
    # Save interactive HTML
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    net.save(f'graph_{timestamp}.html')

def save_graph(G):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save interactive HTML
    display_graph(G, f'Knowledge Graph (Nodes: {len(G.nodes())}, Edges: {len(G.edges())})')
    
    # Save JSON
    graph_data = {
        "nodes": [
            {
                "id": node,
                "label": G.nodes[node].get('label'),
                "text": G.nodes[node].get('text')
            } for node in G.nodes()
        ],
        "edges": [
            {
                "from": u,
                "to": v,
                "label": G.edges[u, v].get('label')
            } for u, v in G.edges()
        ]
    }
    
    with open(f'graph_{timestamp}.json', 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    print(f"\nGraph saved as:\ngraph_{timestamp}.html\ngraph_{timestamp}.json")

try:
    for bookmark in data['data']['content']:
        # Extract and add nodes
        new_nodes = extract_nodes(bookmark, [{"id": n, "label": G.nodes[n].get('label')} for n in G.nodes()])
        
        for node in new_nodes:
            G.add_node(node['id'], label=node['label'], text=node['text'])
        
        # Extract and add edges
        if len(G.nodes()) > 1:
            edges_data = {
                "newNodes": new_nodes,
                "currentEdges": [
                    {"from": u, "to": v, "label": G.edges[u, v].get('label')} 
                    for u, v in G.edges()
                ]
            }
            
            new_edges = extract_edges(edges_data)
            
            for edge in new_edges:
                G.add_edge(edge['from'], edge['to'], label=edge['label'])
        
        # Display updated graph
        display_graph(G, f'Knowledge Graph (Nodes: {len(G.nodes())}, Edges: {len(G.edges())})')

except KeyboardInterrupt:
    print("\nProgram interrupted by user. Saving final graph...")
    save_graph(G)

finally:
    save_graph(G)