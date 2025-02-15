import pygetwindow as gw

def get_windows_info():
    # List all open windows
    windows = [title for title in gw.getAllTitles() if title]
    
    # Get the currently focused window
    current_window = gw.getActiveWindow()
    current_window_title = current_window.title if current_window else "No active window"
    
    return windows, current_window_title
