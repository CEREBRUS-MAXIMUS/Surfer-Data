# Surfer Knowledge Graph Maker

A Python script that creates an interactive knowledge graph visualization from your Surfer data using NetworkX and Pyvis, enhanced with OpenAI's language models for entity and relationship extraction.

## 🚀 Features

- Create dynamic knowledge graphs from your Surfer data
- Entity extraction using OpenAI's GPT models
- Interactive graph visualization with Pyvis
- Export graphs as HTML and JSON files

## 📋 Prerequisites

1. **Surfer Desktop App**
   - Download and install the Surfer Desktop app
   - Export your data to use with the graph maker

2. **OpenAI API Key**
   - Sign up for OpenAI API access
   - Get your API key

## 🛠️ Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd knowledge-graph
```

2. Install the required dependencies:
```bash
pip install networkx pyvis matplotlib openai python-dotenv
```

3. Configure your API key:
   - Create a `.env` file in the project root
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your-openai-api-key
     ```

4. Run the application:
```bash
python app.py
```

## 💡 Usage

The script will:
1. Load your Surfer data
2. Process each bookmark to extract entities and relationships
3. Create an interactive graph visualization
4. Save the final graph in both HTML and JSON formats

During processing:
- A live preview of the graph is updated in `graph_current.html`
- Press Ctrl+C to interrupt and save the current state
- Final graph files are saved with timestamps

## 🎨 Visualization Features

- Interactive node dragging
- Zoom and pan controls
- Physics simulation controls
- Node filtering options
- Node sizes reflect connection count
- Hover tooltips show detailed content
- Edge labels describe relationships

## 📚 Dependencies

- NetworkX: Graph creation and manipulation
- Pyvis: Interactive visualization
- Matplotlib: Graph plotting
- OpenAI: Entity and relationship extraction
- python-dotenv: Environment variable management

## 🔧 Customization

You can modify the visualization by adjusting:
- Node colors (`color` parameter in `display_graph`)
- Edge widths (`width` parameter in `display_graph`)
- Graph physics (using the `show_buttons` options)
- Node and edge label sizes
- Maximum number of extracted entities and relationships (in `llm.py`)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

