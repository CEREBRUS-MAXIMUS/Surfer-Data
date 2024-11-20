import streamlit as st
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure
from surfer_protocol import SurferClient
from openai import OpenAI
from helpers import chunk_object
surfer = SurferClient()

openai_client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])


st.set_page_config(
    page_title="Weaviate + Surfer Chatbot",
    page_icon=":robot_face:",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Add custom CSS
st.markdown("""
    <style>
    .stApp {
        max-width: 800px;
        margin: 0 auto;
    }
    .st-emotion-cache-16idsys p {
        font-size: 1.2rem;
        margin-bottom: 1rem;
    }
    .info-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f0f2f6;
        margin: 1rem 0;
    }
    </style>
""", unsafe_allow_html=True)


# Enhanced header section
st.title("🤖 Weaviate + Surfer Chatbot")

# Create tabs for different sections
tab_intro, tab_data, tab_chat = st.tabs(["📚 Introduction", "📊 Vectorize Data", "💬 Chat"])

# Introduction tab content
with tab_intro:
    st.write("""
    ### Welcome to the Surfer Chatbot! 
    This chatbot helps you explore and analyze your Surfer data using the power of Weaviate's vector database 
    and OpenAI's language models.
    """)
    
    # Enhanced prerequisites section
    with st.expander("📋 Prerequisites & Setup Guide"):
        st.write("""
        1. **Surfer Desktop App**
            - Download the Surfer Desktop app or run locally from https://docs.surferprotocol.org/desktop/installation 
            - Export your data from any platform
            
        2. **Set up Weaviate Cloud**
            - Go to https://weaviate.io/developers/wcs/quickstart to create a Weaviate Cloud instance
            - Copy the cluster URL and API key
                 
        3. **Add API keys to `.streamlit/secrets_template.toml` and rename file to `secrets.toml`**
            - WEAVIATE_URL
            - WEAVIATE_API_KEY
            - OPENAI_API_KEY
        """)

# Set up Weaviate Cloud: https://weaviate.io/developers/wcs/quickstart
weaviate_client = weaviate.connect_to_weaviate_cloud(
    cluster_url=st.secrets["WEAVIATE_URL"],
    auth_credentials=Auth.api_key(st.secrets["WEAVIATE_API_KEY"]),
    headers={"X-OpenAI-API-Key": st.secrets["OPENAI_API_KEY"]}
)

current_collections = weaviate_client.collections.list_all()
if "Data" not in current_collections:
    data_collection = weaviate_client.collections.create(
        name="Data",
        vectorizer_config=Configure.Vectorizer.text2vec_openai(),
        vector_index_config=Configure.VectorIndex.hnsw(
            quantizer=Configure.VectorIndex.Quantizer.bq()
        ),
        generative_config=Configure.Generative.openai()
    )
else:
    data_collection = weaviate_client.collections.get("Data")

existing_data = data_collection.iterator(include_vector=True)

# Vectorize Data tab content
with tab_data:
    st.markdown("### 📊 Vectorize Data")
    if existing_data:
        col1, col2 = st.columns(2)
        with col1:
            add_data_button = st.button("📥 Add Data from Surfer!", use_container_width=True)
        with col2:
            delete_data_button = st.button("🗑️ Delete Data from Weaviate!", use_container_width=True)
    else:
        st.info("ℹ️ No data found. Please add data from Surfer to begin!")

    if delete_data_button:
        weaviate_client.collections.delete("Data")
        st.write("Data deleted from Weaviate!")

    if add_data_button:
        # replace with the platform ID you want to add data for
        all_data = surfer.get('platform-001')
        with data_collection.batch.dynamic() as batch:
            for data in all_data['data']['content']:
                    try:
                        chunked_objects = chunk_object(data)
                        for obj in chunked_objects:
                            batch.add_object(
                                properties={
                                    # choose the specific properties to add to the vector db

                                    # to get the properties, check out the schema for the specific platform here:

                                    # https://docs.surferprotocol.org/desktop/platforms

                                    # example for bookmarks-001:
                                    # "tweet_id": obj['id'],
                                    # "text": obj['text'],
                                    # "username": obj['username'],

                                    # example for connections-001:
                                    # "first_name": obj['first_name'],
                                    # "last_name": obj['last_name'],
                                    # "headline": obj['headline'],
                                },
                            )
                    except Exception as e:
                        st.error(f"Error adding data: {str(e)}")
        st.success("Data added successfully!")

    if existing_data and not delete_data_button:
        data_count = sum(1 for _ in existing_data)
        st.markdown(f"### 📚 Database Status")
        if data_count == 0:
            st.warning("No documents in the database, please add data from Surfer first!")
        else:
            st.info(f"{data_count} documents in the database that you can chat with!")

# Chat Interface tab content
with tab_chat:
    st.markdown("### 💬 Chat Interface")
    if existing_data and not delete_data_button:
        data_count = sum(1 for _ in existing_data)
        
        # Get user input with better prompt
        if prompt := st.chat_input("Ask me anything about your Surfer data..."):
            if data_count == 0:
                st.warning("⚠️ Please add data from Surfer first!")
            else:
                # Display user message with timestamp
                with st.chat_message("user", avatar="🧑‍💻"):
                    st.markdown(prompt)
                
                # Enhanced system prompt
                system_prompt = f"""You are a helpful assistant analyzing Surfer data. 
                Based on the search results, provide a clear and concise answer to the user's question.
                If the information isn't available in the context, please say so.
                
                Question: {prompt}
                """
                
                with st.chat_message("assistant", avatar="🤖"):
                    message_placeholder = st.empty()
                    
                    # Add a loading message
                    with st.spinner("Searching through your data..."):
                        relevant_docs = data_collection.query.hybrid(
                            query=prompt,
                            limit=5,
                        )

                        formatted_content = ""
                        
                        for obj in relevant_docs.objects:
                            properties = obj.properties.copy()
                            
                            # Format the properties into a string
                            formatted_content += "\n".join([f"{key}: {value}" for key, value in properties.items()])
                            
                        response = openai_client.chat.completions.create(
                                model="gpt-4o-mini",
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": formatted_content}
                                ],
                            stream=True
                        )

                        # Stream the response
                        full_response = ""
                        for chunk in response:
                            if chunk.choices[0].delta.content is not None:
                                full_response += chunk.choices[0].delta.content
                                message_placeholder.markdown(full_response + "▌")
                        message_placeholder.markdown(full_response)

# Add footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666;'>
    <p>Built with ❤️ using Streamlit, Weaviate, and Surfer</p>
    <p>Need help? Check out our <a href="https://docs.surferprotocol.org">documentation</a></p>
</div>
""", unsafe_allow_html=True)
weaviate_client.close()