from openai import OpenAI
import json
import logging
from dotenv import load_dotenv
load_dotenv()
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_nodes(data: any, current_nodes: any) -> str:
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """
    You are an AI assistant that extracts new entity nodes from text. Your task is to identify and extract significant entities mentioned in the tweet, focusing on people, ideas, and concepts.

    Return the extracted nodes in the following JSON format:
    {
      "nodes": [
        { "label": "string" }
      ]
    }

    Ensure that each node has a concise label that provides more context about the node.

    Rules:
    - Only extract nodes that are relevant to the tweet.
    - Only extract nodes that are not already in the current nodes.
    - Only extract 5 nodes MAXIUMUM
                    """
                },
                {
                    "role": "user",
                    "content": f"""
    Given the current nodes, extract new nodes from the following text:

    Current nodes:

    {current_nodes}

    Current Text:

    {data['text']}

    Consider people, ideas, and concepts. Avoid creating nodes for actions or temporal information.
                    """
                }
            ],
            model="gpt-4o-mini",
            response_format={ "type": "json_object" }
        )
        
        nodes = response.choices[0].message.content
        nodes = json.loads(nodes)['nodes']
        
        nodes = [{"id": f"{data['id']}_{i}", "text": data['text'], **node} for i, node in enumerate(nodes)]
        
        return nodes
    except Exception as e:
        logging.error(f"Error extracting nodes: {str(e)}")
        return []

def extract_edges(data: dict) -> list:
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """
    You are an AI assistant that extracts new relationships (edges) between nodes. Your task is to identify connections between the given nodes based on their content.

    Return the extracted edges in the following JSON format:
    {
      "edges": [
        { 
          "from": "node_id_1",
          "to": "node_id_2",
          "label": "RELATIONSHIP"
        }
      ]
    }

    Rules:
    - Only create edges between nodes that have a clear relationship based on their content
    - The label should be a short, ALL-CAPS description of the relationship
    - Only create edges that are not already in the current edges
    - Maximum 5 edges per analysis
    - Use the node IDs exactly as provided in the input
    """
                },
                {
                    "role": "user",
                    "content": f"""
    New nodes:
    {json.dumps(data['newNodes'], indent=2)}

    Current edges:
    {json.dumps(data['currentEdges'], indent=2)}

    Create edges between these nodes if meaningful relationships exist.
    """
                }
            ],
            model="gpt-4o-mini",
            response_format={ "type": "json_object" }
        )
        
        edges = json.loads(response.choices[0].message.content)['edges']
        return edges
    except Exception as e:
        logging.error(f"Error extracting edges: {str(e)}")
        return []
