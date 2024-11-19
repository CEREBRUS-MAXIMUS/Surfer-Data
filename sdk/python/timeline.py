from client import SurferClient
from streamlit_calendar import calendar
import streamlit as st
from datetime import datetime

client = SurferClient()

bookmarks = client.get('bookmarks-001')
messages = client.get('imessage-001')
emails = client.get('gmail-001')

# Create calendar events from bookmarks, messages, and emails
calendar_events = []

# Helper function to get date from ISO timestamp
def get_date_from_iso(iso_timestamp):
    return iso_timestamp.split('T')[0]

# Group items by date
date_groups = {
    'bookmarks': {},
    'messages': {},
    'emails': {}
}

# Group bookmarks
for bookmark in bookmarks['data']['content']:
    bookmark_date = bookmark['timestamp']
    date = get_date_from_iso(bookmark_date)
    
    if date not in date_groups['bookmarks']:
        date_groups['bookmarks'][date] = []
    date_groups['bookmarks'][date].append(bookmark_date)

# Group messages
for message in messages['data']['content']:
    date = get_date_from_iso(message['timestamp'])
    if date not in date_groups['messages']:
        date_groups['messages'][date] = []
    date_groups['messages'][date].append(message['timestamp'])

# Group emails
for email in emails['data']['content']:
    date = get_date_from_iso(email['timestamp'])
    if date not in date_groups['emails']:
        date_groups['emails'][date] = []
    date_groups['emails'][date].append(email['timestamp'])

# Colors for different types
colors = {
    'bookmarks': "#4CAF50",
    'messages': "#2196F3",
    'emails': "#FF9800"
}

# Add all grouped items as events
for item_type, dates in date_groups.items():
    for date, timestamps in dates.items():
        count = len(timestamps)
        title = f"{count} {item_type[:-1] if count == 1 else item_type}"
        
        calendar_events.append({
            "title": title,
            "start": timestamps[0],
            "allDay": True,
            "backgroundColor": colors[item_type]
        })

# Calendar configuration
calendar_options = {
    "headerToolbar": {
        "left": "today prev,next",
        "center": "title",
        "right": "dayGridMonth,timeGridWeek,timeGridDay"
    },
    "initialView": "dayGridMonth",
    "selectable": True,
    "editable": False,
}

# Custom styling
custom_css = """
    .fc-event-past {
        opacity: 0.8;
    }
    .fc-event-title {
        font-weight: 700;
    }
    .fc-toolbar-title {
        font-size: 2rem;
    }
"""

# Create and display the calendar
cal = calendar(
    events=calendar_events,
    options=calendar_options,
    custom_css=custom_css
)
st.write(cal)

