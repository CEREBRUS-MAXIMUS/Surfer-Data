import streamlit as st
from surfer_protocol import SurferClient
from datetime import datetime

st.title("Twitter Bookmarks Viewer")

# Initialize client
client = SurferClient()
tweets = client.get('bookmarks-001')
print(len(tweets['data']['content']))

# Add search and filter widgets
col1, col2, col3 = st.columns(3)
with col1:
    search_query = st.text_input("Search in tweets", "")
with col2:
    usernames = sorted(list(set(tweet['username'] for tweet in tweets['data']['content'])))
    selected_users = st.multiselect("Filter by username", options=usernames)
with col3:
    min_date = st.date_input("Show tweets from", value=None)

# Only show results if any filter is applied
if search_query or selected_users or min_date:
    filtered_tweets = []
    for tweet in tweets['data']['content']:
        # Apply text search filter
        tweet_text = tweet.get('text', '').lower()
        search_term = search_query.lower()
        text_matches = search_term in tweet_text if search_query else True
        
        # Apply username filter
        user_matches = tweet['username'] in selected_users if selected_users else True
        
        # Apply date filter
        tweet_date = datetime.strptime(tweet['timestamp'], "%a %b %d %H:%M:%S %z %Y")
        tweet_date = tweet_date.date()  # Convert to date only, removing time and timezone
        date_matches = tweet_date >= min_date if min_date else True
        
        if text_matches and user_matches and date_matches:
            filtered_tweets.append(tweet)
    
    # Display results
    if filtered_tweets:
        for tweet in filtered_tweets:
            with st.expander(f"@{tweet['username']} - {tweet['timestamp']}"):
                st.write(tweet['text'])
                if tweet.get('media'):
                    st.write("Media:", tweet['media'])
                st.write(f"Tweet ID: {tweet['id']}")
    else:
        st.info("No tweets match your search criteria")
else:
    st.info("Enter a search term, select users, or choose a date to view tweets") 