import streamlit as st
from client import SurferClient
from datetime import datetime

st.title("Gmail Viewer")

# Initialize client
client = SurferClient()
emails = client.get('gmail-001')

# Add search and filter widgets
col1, col2 = st.columns(2)
with col1:
    search_query = st.text_input("Search in email body", "")
with col2:
    min_date = st.date_input("Show emails from", value=None)

# Only show results if search or date filter is applied
if search_query or min_date:
    filtered_emails = []
    for email in emails['data']['content']:
        # Apply text search filter
        email_body = email.get('body', '').lower()
        email_subject = email.get('subject', '').lower()
        search_term = search_query.lower()
        body_matches = search_term in email_body or search_term in email_subject if search_query else True
        
        # Apply date filter
        email_date = datetime.fromisoformat(email['timestamp'].replace('Z', '+00:00')).date()
        date_matches = email_date >= min_date if min_date else True
        
        if body_matches and date_matches:
            filtered_emails.append(email)
    
    # Display results
    if filtered_emails:
        for email in filtered_emails:
            subject = email.get('subject', '(No subject)')
            sender = email.get('from', '(No sender)')
            with st.expander(f"From: {sender} - Subject: {subject}"):
                if email.get('to'):
                    st.write(f"To: {email['to']}")
                if email.get('timestamp'):
                    st.write(f"Date: {email['timestamp']}")
                if email.get('body'):
                    st.write("Body:", email['body'])
    else:
        st.info("No emails match your search criteria")
else:
    st.info("Enter a search term or select a date to view emails")
