import sys
import sqlite3
import os
import sqlite3
import json
from datetime import datetime, timedelta
import glob

if len(sys.argv) < 7:
    print("Error: Not enough arguments provided")
    sys.exit(1)

folder_path = sys.argv[1]
company = sys.argv[2]
name = sys.argv[3]
password = sys.argv[4]
app_data_path = sys.argv[5]  # New argument for the app's data path
id = sys.argv[6]

def apple_time_to_iso(apple_timestamp):
    # Convert Apple timestamp (nanoseconds) to seconds
    seconds_since_reference = apple_timestamp / 1_000_000_000

    # Apple's reference date is January 1, 2001
    reference_date = datetime(2001, 1, 1)

    # Calculate the actual date
    actual_date = reference_date + timedelta(seconds=seconds_since_reference)

    # Convert to ISO 8601 format
    iso_string = actual_date.isoformat()

    return iso_string

try:
    # Define the output directory using the provided app data path
    output_dir = os.path.join(app_data_path, 'surfer_data', company, name, id)

    # Ensure the directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Connect to the iMessage SQLite database
    imessage_conn = sqlite3.connect("/Users/jackblair/Library/Messages/chat.db")
    imessage_cursor = imessage_conn.cursor()

    # Find the contacts database
    home_dir = os.path.expanduser("~")
    address_book_dir = os.path.join(home_dir, "Library", "Application Support", "AddressBook", "Sources")
    contacts_db_path = None

    for uuid_dir in os.listdir(address_book_dir):
        possible_db = os.path.join(address_book_dir, uuid_dir, "AddressBook-v22.abcddb")
        if os.path.exists(possible_db):
            contacts_db_path = possible_db
            break

    if contacts_db_path is None:
        print("Error: Could not find contacts database")
        sys.exit(1)

    # Connect to the contacts SQLite database
    contacts_conn = sqlite3.connect(contacts_db_path)
    contacts_cursor = contacts_conn.cursor()

    # Query to fetch messages
    message_query = """
    SELECT
        message.ROWID,
        message.text,
        message.date,
        handle.id as contact,
        message.is_from_me
    FROM
        message
    LEFT JOIN
        handle ON message.handle_id = handle.ROWID
    ORDER BY
        message.date DESC
    """

    # Query to fetch contacts
    contact_query = """
    SELECT
        CASE
            WHEN c0First IS NOT NULL AND c1Last IS NOT NULL THEN c0First || ' ' || c1Last
            WHEN c0First IS NOT NULL THEN c0First
            ELSE "NO CONTACT"
        END as full_name,
        c16Phone
    FROM
        ABPersonFullTextSearch_content
    WHERE
        c16Phone IS NOT NULL AND c16Phone != ''
    """

    #make a query to list all the tables in the contacts database
    contact_query = """
    SELECT name FROM sqlite_master WHERE type='table';
    """

    # Execute queries
    imessage_cursor.execute(message_query)
    contacts_cursor.execute(contact_query)

    # Fetch all results
    messages = imessage_cursor.fetchall()
    contacts = contacts_cursor.fetchall()
    print(messages)
    print(contacts)

    # # save contacts to a JSON!!
    # contacts_json_path = os.path.join(output_dir, 'my_contacts.json')
    # with open(contacts_json_path, 'w') as f:
    #     json.dump(contacts, f, indent=2)

    # # Create a dictionary to map phone numbers to names
    # contact_dict = {}
    # for full_name, phone in contacts:
    #     # Remove any non-digit characters from the phone number
    #     clean_phone = ''.join(filter(str.isdigit, phone))
    #     # Store multiple versions of the phone number
    #     if len(clean_phone) >= 10:
    #         contact_dict[clean_phone[-10:]] = full_name.strip()  # Last 10 digits
    #         contact_dict[clean_phone[-7:]] = full_name.strip()   # Last 7 digits
    #         if len(clean_phone) > 10:
    #             contact_dict[clean_phone[-11:]] = full_name.strip()  # Last 11 digits (with country code)

    # # Convert to list of dictionaries
    # message_list = []
    # for msg in messages:
    #     contact = msg[3]
    #     if contact:
    #         # Remove any non-digit characters from the contact
    #         clean_contact = ''.join(filter(str.isdigit, contact)) or contact
    #         # Try to match with different lengths
    #         if len(clean_contact) >= 10:
    #             name = contact_dict.get(clean_contact[-10:], contact)
    #         if len(clean_contact) >= 7:
    #             name = contact_dict.get(clean_contact[-7:], name)
    #         if len(clean_contact) > 10:
    #             name = contact_dict.get(clean_contact[-11:], name)

    #     if msg[1] is not None:
    #         message_list.append({
    #             'id': msg[0],
    #             'text': msg[1],
    #             'date': apple_time_to_iso(msg[2]) if msg[2] is not None else None,
    #             'contact': name,
    #             'is_from_me': True if msg[4] == 1 else False
    #         })
    # Close the database connections
    imessage_conn.close()
    contacts_conn.close()

    # Save to JSON file
    imessage_json_path = os.path.join(output_dir, 'imessages.json')
    with open(imessage_json_path, 'w') as f:
        json.dump(message_list, f, indent=2)

    print(output_dir)

    sys.exit(0)
except Exception as e:
    if "Invalid password" in str(e):
        print('INVALID_PASSWORD')
    else:
        print(f"ERROR: {str(e)}")
    sys.exit(1)




