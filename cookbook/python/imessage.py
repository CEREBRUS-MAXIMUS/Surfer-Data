from surfer_protocol import SurferClient
import streamlit as st
import json
from datetime import datetime
from collections import Counter
import emoji
import re
from nltk.corpus import stopwords
import nltk

# Download the stopwords data (run once)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Create a client instance
client = SurferClient()

# Add a title to the Streamlit app
st.title("iMessages Viewer")

# Add tabs for different views
tab1, tab2 = st.tabs(["Search Messages", "Message Analytics"])

with tab1:
    try:
        result = client.get('imessage-001')
        
        # Extract unique contacts from messages
        contacts = sorted(list(set(message['contact'] for message in result['data'])))
        
        # Add search and filter controls
        col1, col2 = st.columns(2)
        with col1:
            search_query = st.text_input("Search messages", "")
        with col2:
            selected_contacts = st.multiselect(
                "Filter by contact",
                options=contacts,
                placeholder="Select contacts"
            )
        
        st.write("Messages:")
        
        # Only proceed if there's a search query or selected contacts
        if search_query or selected_contacts:
            matching_messages = 0
            for message in result['data']:
                # Apply text search and contact filters
                if search_query and search_query.lower() not in message['text'].lower():
                    continue
                if selected_contacts and message['contact'] not in selected_contacts:
                    continue
                    
                st.code(json.dumps(message, indent=4))
                matching_messages += 1
            
            st.write(f"Found {matching_messages} matching messages")
        else:
            st.info("Enter a search term or select contacts to view messages")

    except ConnectionError as e:
        st.error(f"Error connecting to the service: {e}")
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")

with tab2:
    st.header("📱 Message Analytics")
    
    try:
        result = client.get('imessage-001')
        messages = result['data']
        
        # Top 5 contacts by message count
        contact_counts = Counter(msg['contact'] for msg in messages)
        st.subheader("👥 Most Frequent Contacts")
        for contact, count in contact_counts.most_common(5):
            st.write(f"{contact}: {count} messages")
        
        # Top 5 words (modified section)
        stop_words = set(stopwords.words('english'))
        # Add extra common words you want to filter
        extra_stop_words = {'lol', 'im', 'like', 'just', 'got', 'yeah', 'ok', 'okay', 'u', 'ur', 'dont', 'thats', 'cant', 'didnt', 'ill', 'na', 'gonna', 'wanna', 'gotta', 'idk'}
        stop_words.update(extra_stop_words)
        
        all_words = []
        for msg in messages:
            # Split text into words, convert to lowercase, and filter out stop words
            words = re.findall(r'\w+', msg['text'].lower())
            words = [word for word in words if word not in stop_words and len(word) > 1]  # Also filter out single letters
            all_words.extend(words)
        word_counts = Counter(all_words)
        
        st.subheader("📝 Most Used Words")
        for word, count in word_counts.most_common(5):
            st.write(f"'{word}': {count} times")
        
        # Top 5 emojis
        all_emojis = []
        for msg in messages:
            emojis = [c for c in msg['text'] if c in emoji.EMOJI_DATA]
            all_emojis.extend(emojis)
        emoji_counts = Counter(all_emojis)
        
        st.subheader("😊 Most Used Emojis")
        for emoji_char, count in emoji_counts.most_common(5):
            st.write(f"{emoji_char}: {count} times")
        
        # Response time analysis
        contact_response_times = {}
        for i in range(1, len(messages)):
            curr_msg = messages[i]
            prev_msg = messages[i-1]
            
            if curr_msg['contact'] == prev_msg['contact']:
                continue
                
            response_time = datetime.fromisoformat(curr_msg['date']) - datetime.fromisoformat(prev_msg['date'])
            if curr_msg['contact'] not in contact_response_times:
                contact_response_times[curr_msg['contact']] = []
            contact_response_times[curr_msg['contact']].append(response_time.total_seconds())
        
        # Calculate average response times
        avg_response_times = {
            contact: sum(times) / len(times) 
            for contact, times in contact_response_times.items() 
            if times
        }
        
        # Slowest responders
        st.subheader("👻 Slowest Responders")
        sorted_slow = sorted(avg_response_times.items(), key=lambda x: x[1], reverse=True)
        for contact, time in sorted_slow[:5]:
            st.write(f"{contact}: {time/60:.1f} minutes")
        
        # Fastest responders
        st.subheader("🔥 Fastest Responders")
        sorted_fast = sorted(avg_response_times.items(), key=lambda x: x[1])
        for contact, time in sorted_fast[:5]:
            st.write(f"{contact}: {time/60:.1f} minutes")
            
    except Exception as e:
        st.error(f"An error occurred while analyzing messages: {e}")