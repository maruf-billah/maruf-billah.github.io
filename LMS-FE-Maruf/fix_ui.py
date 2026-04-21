import os
import re

directory = r'd:\Antigravity\LMS - FE'
html_files = [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith('.html')]

old_user_re = re.compile(
    r'<div class="navbar-user"(?: onclick="[^"]*")?>\s*<div class="user-avatar"[^>]*>.*?</div>\s*<div class="user-info">\s*<div class="user-name"[^>]*>.*?</div>\s*<div class="user-role"[^>]*>.*?</div>\s*</div>\s*(?:<div class="user-dropdown">.*?</div>\s*)?</div>',
    re.DOTALL
)

new_user = """<div class="navbar-user" onclick="toggleUserDropdown(event)">
                <div class="user-avatar" id="userAvatar">U</div>
                <div class="user-info">
                    <div class="user-name" id="userName">User</div>
                    <div class="user-role" id="userRole">Beneficiary</div>
                </div>
                <div class="user-dropdown">
                    <a href="profile.html" class="dropdown-item">👤 My Profile</a>
                    <a href="change-password.html" class="dropdown-item">🔒 Change Password</a>
                </div>
            </div>"""

old_header_re = re.compile(
    r'<div class="sidebar-header"(?: style="[^"]*")?>\s*(?:(?:<a href="landing\.html" class="sidebar-logo"(?: style="[^"]*")?>.*?</a>|<div class="sidebar-logo">.*?</div>))\s*(?:<button class="sidebar-collapse-btn"[^>]*>.*?</button>\s*)?</div>',
    re.DOTALL
)

new_header = """<div class="sidebar-header" style="display:flex;align-items:center;justify-content:space-between;">
            <a href="landing.html" class="sidebar-logo" style="text-decoration:none;">📚 LMS</a>
            <button class="sidebar-collapse-btn" onclick="toggleSidebar()" title="Collapse sidebar">«</button>
        </div>"""

for file_path in html_files:
    if 'login.html' in file_path or 'register.html' in file_path or 'change-password.html' in file_path:
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = old_user_re.sub(new_user, content)
    content = old_header_re.sub(new_header, content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {os.path.basename(file_path)}')
