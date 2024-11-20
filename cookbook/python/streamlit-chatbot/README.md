# Weaviate + Surfer Chatbot

A Streamlit-based chatbot that allows you to interact with your Surfer data using Weaviate's vector database and OpenAI's language models.

## 🚀 Features

- Interactive chat interface with your Surfer data
- Vector search powered by Weaviate
- Real-time data vectorization
- Streaming responses using OpenAI's GPT models
- Easy data management with add/delete functionality

## 📋 Prerequisites

1. **Surfer Desktop App**
   - Download and install the Surfer Desktop app
   - Export your data to use with this chatbot

2. **Weaviate Cloud Account**
   - Set up a Weaviate Cloud instance
   - Get your Weaviate URL and API key

3. **OpenAI API Key**
   - Sign up for OpenAI API access
   - Get your API key

## 🛠️ Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd streamlit-chatbot
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your API keys:
   - Rename `.streamlit/secrets_template.toml` to `.streamlit/secrets.toml`
   - Add your API keys to the file:
     ```toml
     WEAVIATE_URL = "your-weaviate-url"
     WEAVIATE_API_KEY = "your-weaviate-api-key"
     OPENAI_API_KEY = "your-openai-api-key"
     ```

4. Run the application:
```bash
streamlit run app.py
```

## 💡 Usage

1. **Introduction Tab**
   - Read about the chatbot and setup instructions

2. **Vectorize Data Tab**
   - Add your Surfer data to the Weaviate database
   - Delete existing data if needed
   - View current database status

3. **Chat Tab**
   - Interact with your data through natural language queries
   - Get AI-powered responses based on your Surfer data

## 🔧 Customization

The chatbot can be customized to work with different Surfer data types. Check the schema for specific platforms in the [Surfer documentation](https://docs.surferprotocol.org/desktop/platforms).

## 📚 Dependencies

See `requirements.txt` for a complete list of dependencies.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
