import sys
import sqlite3
import json
import os
from datetime import datetime
import re


def get_contacts_db_path(username):
    """Find the path to the macOS AddressBook SQLite database."""
    sources_dir = os.path.join(
        '/Users', 
        username, 
        'Library/Application Support/AddressBook/Sources'
    )
    
    if not os.path.exists(sources_dir):
        raise FileNotFoundError(f"Sources directory not found: {sources_dir}")

    # Search through subfolders for the first valid database
    for folder in os.listdir(sources_dir):
        db_path = os.path.join(sources_dir, folder, 'AddressBook-v22.abcddb')
        if os.path.exists(db_path):
            return db_path

    raise FileNotFoundError('No AddressBook database found in Sources.')

def apple_time_to_iso(timestamp):
    """Convert Apple's timestamp to ISO 8601 format."""
    if timestamp is None:
        return None
    try:
        unix_timestamp = timestamp / 1e9 + 978307200
        dt = datetime.fromtimestamp(unix_timestamp)
        return dt.isoformat()
    except (ValueError, OverflowError) as e:
        print(f"Warning: Invalid timestamp {timestamp}: {str(e)}")
        return None

def clean_phone_number(phone):
    """Remove non-digit characters from phone number."""
    return re.sub(r'\D', '', phone) if phone else ''

def check_database_access(db_path):
    """Check if we have access to the Messages database."""
    try:
        with open(db_path, 'rb') as f:
            # Try to read first byte to verify access
            f.read(1)
        return True
    except PermissionError:
        print("PERMISSION_ERROR: Full Disk Access required")
        sys.exit(13)
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

def main():
    try:
        
        if len(sys.argv) < 5:
            print("Error: Not enough arguments provided")
            print("Usage: python imessage_mac.py <company> <name> <id> <app_data_path>")
            sys.exit(1)

        company = sys.argv[1]
        platform_name = sys.argv[2]
        run_id = sys.argv[3]
        app_data_path = sys.argv[4]

        username = os.environ.get('USER')
        if not username:
            print("Error: Could not determine username")
            sys.exit(1)

        # Setup paths
        messages_db_path = os.path.join('/Users', username, 'Library/Messages/chat.db')
        if not os.path.exists(messages_db_path):
            print("Error: iMessage database not found!")
            sys.exit(1)

        # Check database access before attempting to copy
        check_database_access(messages_db_path)

        # Fix the path to ensure use "Application Support" instead of just "Application" - A wierd electron quirk, ask Chat to learn more
        if app_data_path.endswith('/Library/Application'):
            app_data_path = app_data_path.replace('/Library/Application', '/Library/Application Support')
        elif '/Library/Application/' in app_data_path:
            app_data_path = app_data_path.replace('/Library/Application/', '/Library/Application Support/')
            
        output_dir = os.path.join(app_data_path, 'exported_data', company, platform_name, run_id)
        os.makedirs(output_dir, exist_ok=True)

        # Copy and connect to Messages database
        temp_db_path = os.path.join(output_dir, 'chat.db')
        os.system(f'cp "{messages_db_path}" "{temp_db_path}"')
        
        messages_db = sqlite3.connect(temp_db_path)
        messages_cursor = messages_db.cursor()

        # Fetch messages
        messages_query = """
        SELECT 
            message.ROWID as id,
            message.text,
            message.date,
            handle.id as contact_id,
            message.is_from_me
        FROM message 
        LEFT JOIN handle ON message.handle_id = handle.ROWID
        ORDER BY message.date DESC
        """
        messages_cursor.execute(messages_query)
        messages = messages_cursor.fetchall()

        # Connect to and query contacts database
        contacts_db = sqlite3.connect(get_contacts_db_path(username))
        contacts_cursor = contacts_db.cursor()

        contacts_query = """
        SELECT 
            ZABCDRECORD.ZFIRSTNAME as first_name,
            ZABCDRECORD.ZLASTNAME as last_name,
            ZABCDPHONENUMBER.ZFULLNUMBER as phone_number,
            ZABCDEMAILADDRESS.ZADDRESS as email
        FROM ZABCDRECORD
        LEFT JOIN ZABCDPHONENUMBER ON ZABCDRECORD.Z_PK = ZABCDPHONENUMBER.ZOWNER
        LEFT JOIN ZABCDEMAILADDRESS ON ZABCDRECORD.Z_PK = ZABCDEMAILADDRESS.ZOWNER
        WHERE ZABCDRECORD.ZFIRSTNAME IS NOT NULL 
            OR ZABCDRECORD.ZLASTNAME IS NOT NULL
        """
        contacts_cursor.execute(contacts_query)
        contacts = contacts_cursor.fetchall()

        # Create contact mapping
        contact_dict = {}
        for first_name, last_name, phone, email in contacts:
            full_name = f"{first_name or ''} {last_name or ''}".strip()
            if not full_name:
                continue

            if phone:
                clean_phone = clean_phone_number(phone)
                if clean_phone:
                    contact_dict[f"+{clean_phone}"] = full_name
                    contact_dict[clean_phone] = full_name
                    contact_dict[f"+1{clean_phone}"] = full_name

            if email:
                contact_dict[email.lower()] = full_name

        # Process messages
        message_list = []
        for msg_id, text, date, contact_id, is_from_me in messages:
            if text is None:
                continue

            contact_name = contact_id
            if contact_id:
                if re.match(r'^\+?[\d-]+$', contact_id):
                    clean_contact = clean_phone_number(contact_id)
                    contact_name = (
                        contact_dict.get(contact_id) or
                        contact_dict.get(f"+{clean_contact}") or
                        contact_dict.get(clean_contact) or
                        contact_dict.get(f"+1{clean_contact}") or
                        contact_id
                    )
                else:
                    contact_name = contact_dict.get(contact_id.lower(), contact_id)

            message_list.append({
                'id': msg_id,
                'text': text,
                'timestamp': apple_time_to_iso(date),
                'contact': contact_name,
                'is_from_me': bool(is_from_me)
            })

        # Prepare output
        output = {
            'company': company,
            'name': platform_name,
            'runID': run_id,
            'timestamp': int(run_id.split('-')[-1]),
            'content': message_list
        }

        # Save to file
        output_path = os.path.join(output_dir, 'imessage-001.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        # Clean up
        messages_db.close()
        contacts_db.close()
        os.remove(temp_db_path)

        # Print output directory for the TypeScript code to capture
        print(output_dir)
        sys.exit(0)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()