import os
import json
import urllib.parse
from datetime import datetime

history_dir = r'C:\Users\Hadoop\AppData\Roaming\Code\User\History'

targets = ['course_details.html', 'contents.html', 'module-detail.html', 'module_details.html', 'app.js', 'my-progress.html', 'certificate.html']

for root, dirs, files in os.walk(history_dir):
    if 'entries.json' in files:
        entries_path = os.path.join(root, 'entries.json')
        try:
            with open(entries_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            res = data.get('resource', '')
            decoded = urllib.parse.unquote(res)
            
            if 'LMS - FE' in decoded and any(t in decoded for t in targets):
                print(f'\nFound tracking for: {decoded}')
                for entry in data.get('entries', []):
                    ts = entry.get('timestamp', 0) / 1000.0
                    dt = datetime.fromtimestamp(ts)
                    eid = entry.get('id', '')
                    print(f'   Entry: {eid} at {dt} (local)')
                    file_path = os.path.join(root, eid)
                    if os.path.exists(file_path):
                        print(f'   Path: {file_path}')
        except Exception as e:
            pass
