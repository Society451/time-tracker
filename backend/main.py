from timeTracker import get_windows_info, get_focused_windows, get_application_name
from datetime import datetime
import time, os, json, csv, webview
import threading

# Time tracking methods
# Folder creation/management
# Etc

def check_and_create_storage():
    storage_path = os.path.join(os.getcwd(), 'storage')
    if not os.path.exists(storage_path):
        os.makedirs(storage_path)
    
    today = datetime.now().strftime('%Y-%m-%d')
    day_folder = os.path.join(storage_path, today)
    if not os.path.exists(day_folder):
        os.makedirs(day_folder)
    
    json_file_path = os.path.join(day_folder, f'{today}.json')
    csv_file_path = os.path.join(day_folder, f'{today}.csv')
    
    if not os.path.exists(json_file_path):
        with open(json_file_path, 'w') as json_file:
            json.dump([], json_file)
    
    if not os.path.exists(csv_file_path):
        with open(csv_file_path, 'w', newline='') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(['timestamp', 'focused_window', 'open_windows'])

def track_window_focus():
    check_and_create_storage()
    today = datetime.now().strftime('%Y-%m-%d')
    day_folder = os.path.join(os.getcwd(), 'storage', today)
    json_file_path = os.path.join(day_folder, f'{today}.json')
    csv_file_path = os.path.join(day_folder, f'{today}.csv')
    
    last_focused_window = None
    last_open_windows = None
    
    while True:
        windows, current_window_title = get_windows_info()
        current_application, current_window = get_application_name(current_window_title)
        
        if current_application != last_focused_window or windows != last_open_windows:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            data = {
                'timestamp': timestamp,
                'focused_window': f"{current_window} - {current_application}",
                'open_windows': [f"{get_application_name(w)[1]} - {get_application_name(w)[0]}" for w in windows]
            }
            
            with open(json_file_path, 'r+') as json_file:
                try:
                    content = json.load(json_file)
                except json.JSONDecodeError:
                    content = []
                content.append(data)
                json_file.seek(0)
                json.dump(content, json_file, indent=4)
            
            with open(csv_file_path, 'a', newline='') as csv_file:
                writer = csv.writer(csv_file)
                writer.writerow([timestamp, f"{current_window} - {current_application}", [f"{get_application_name(w)[1]} - {get_application_name(w)[0]}" for w in windows]])
            
            last_focused_window = current_application
            last_open_windows = windows
        
        time.sleep(0.1)

class API:
    def get_data(self):
        today = datetime.now().strftime('%Y-%m-%d')
        day_folder = os.path.join(os.getcwd(), 'storage', today)
        json_file_path = os.path.join(day_folder, f'{today}.json')
        csv_file_path = os.path.join(day_folder, f'{today}.csv')
        
        data = {
            "json_data": [],
            "csv_data": []
        }
        
        # Read JSON data
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r') as json_file:
                try:
                    data["json_data"] = json.load(json_file)
                except json.JSONDecodeError:
                    data["json_data"] = []
        
        # Read CSV data
        if os.path.exists(csv_file_path):
            with open(csv_file_path, 'r') as csv_file:
                reader = csv.DictReader(csv_file)
                data["csv_data"] = list(reader)
        
        print("Data prepared for frontend:", data)
        return json.dumps(data)

    def get_focused_windows(self):
        focused_window = get_focused_windows()
        return json.dumps({"focused_window": focused_window})

def start_webview():
    api = API()
    html_path = os.path.join(os.getcwd(), 'frontend', 'main.html')
    window = webview.create_window('Time Tracker', html_path, js_api=api)
    print("Starting webview with API")
    webview.start(debug=False)

if __name__ == '__main__':
    # Start the window focus tracking in a separate thread
    tracking_thread = threading.Thread(target=track_window_focus)
    tracking_thread.daemon = True
    tracking_thread.start()
    
    # Start the webview
    start_webview()

