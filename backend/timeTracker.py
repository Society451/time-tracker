import pygetwindow as gw

def get_windows_info():
    # List all open windows
    windows = [title for title in gw.getAllTitles() if title]
    
    # Get the currently focused window
    current_window = gw.getActiveWindow()
    current_window_title = current_window.title if current_window else "No active window"
    
    return windows, current_window_title

def get_focused_windows():
    current_window = gw.getActiveWindow()
    return current_window.title if current_window else "No active window"

def get_application_name(window_title):
    # Handle common application title formats
    if " - " in window_title:
        parts = window_title.split(" - ")
        if len(parts) > 2:
            return parts[-1].strip(), " - ".join(parts[:-1]).strip()
        return parts[-1].strip(), parts[0].strip()
    return window_title.strip(), window_title.strip()
