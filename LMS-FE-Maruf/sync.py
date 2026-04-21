import os, re

def extract(html, pattern):
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        raise Exception(f"Pattern {pattern} not found in HTML!")
    return match.group(0)

with open('analytics.html', 'r', encoding='utf-8') as f:
    analytics = f.read()

nav_html = extract(analytics, r'<nav class="navbar">.*?</nav>')
aside_html = extract(analytics, r'<aside class="sidebar" id="sidebar">.*?</aside>')

# For the CSS, let's extract all the global styles up to .chart-card in analytics.html
css_part = extract(analytics, r'\s+\.navbar \{.*?\.sidebar-footer \{.*?\}')

# Let's read reports.html
with open('reports.html', 'r', encoding='utf-8') as f:
    reports = f.read()

# Replace HTML
reports = re.sub(r'<nav class="navbar">.*?</nav>', nav_html.replace('\\', r'\\'), reports, flags=re.DOTALL)
reports = re.sub(r'<aside class="sidebar" id="sidebar">.*?</aside>', aside_html.replace('\\', r'\\'), reports, flags=re.DOTALL)

# Replace CSS
reports_css_target = extract(reports, r'\s+\.navbar \{.*?\.sidebar-footer \{.*?\}')
reports = reports.replace(reports_css_target, css_part)

with open('reports.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(reports)

# Let's read profile.html
with open('profile.html', 'r', encoding='utf-8') as f:
    profile = f.read()

profile = re.sub(r'<nav class="navbar">.*?</nav>', nav_html.replace('\\', r'\\'), profile, flags=re.DOTALL)
profile = re.sub(r'<aside class="sidebar" id="sidebar">.*?</aside>', aside_html.replace('\\', r'\\'), profile, flags=re.DOTALL)
profile_css_target = extract(profile, r'\s+\.navbar \{.*?\.sidebar-footer \{.*?\}')
profile = profile.replace(profile_css_target, css_part)

with open('profile.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(profile)

# Let's rebuild change-password.html
pw_main = """
    <!-- Main Content -->
    <main class="main-content">
        <div class="container" style="max-width: 600px; margin: var(--space-2xl) auto;">
            <!-- Change Password Section -->
            <div class="info-section" id="passwordSection">
                <h3>🔒 Change Password</h3>
                <p class="text-muted mb-lg" style="font-size:var(--text-sm);">Update your account password. Use a strong
                    password with at least 6 characters.</p>
                <div id="pwdMessage"
                    style="display:none; padding: var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md); font-weight: 500;">
                </div>
                <div class="info-grid">
                    <div class="info-item mt-sm">
                        <span class="info-label">Current Password</span>
                        <div style="position:relative;">
                            <input type="password" id="currentPassword" class="form-input"
                                placeholder="Enter current password" style="display:block;">
                        </div>
                    </div>
                    <div class="info-item mt-sm">
                        <span class="info-label">New Password</span>
                        <input type="password" id="newPassword" class="form-input" placeholder="Minimum 6 characters"
                            style="display:block;">
                    </div>
                    <div class="info-item mt-sm">
                        <span class="info-label">Confirm New Password</span>
                        <input type="password" id="confirmPassword" class="form-input"
                            placeholder="Re-enter new password" style="display:block;">
                    </div>
                </div>
                <div style="margin-top: var(--space-xl); display: flex; justify-content: flex-end;">
                    <button class="btn btn-primary" onclick="handleChangePassword()">🔑 Save New Password</button>
                </div>
            </div>
        </div>
    </main>

    <script src="app.js"></script>
    <script>
        // Load user data
        const userNameInfo = getUserName();
        document.getElementById('userAvatar').textContent = userNameInfo.charAt(0).toUpperCase();

        function handleChangePassword() {
            const mobile = localStorage.getItem('userMobile') || localStorage.getItem('userEmail');
            const current = document.getElementById('currentPassword').value;
            const newPwd = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            const msgEl = document.getElementById('pwdMessage');

            if (!current || !newPwd || !confirm) {
                msgEl.style.display = 'block';
                msgEl.style.background = 'var(--error-light)';
                msgEl.style.color = 'var(--error)';
                msgEl.textContent = '⚠️ Please fill in all password fields.';
                return;
            }

            if (newPwd !== confirm) {
                msgEl.style.display = 'block';
                msgEl.style.background = 'var(--error-light)';
                msgEl.style.color = 'var(--error)';
                msgEl.textContent = '⚠️ New password and confirmation do not match.';
                return;
            }

            const result = changeUserPassword(mobile, current, newPwd);
            msgEl.style.display = 'block';
            if (result.success) {
                msgEl.style.background = 'var(--success-light)';
                msgEl.style.color = 'var(--success)';
                msgEl.textContent = '✅ ' + result.message;
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                msgEl.style.background = 'var(--error-light)';
                msgEl.style.color = 'var(--error)';
                msgEl.textContent = '⚠️ ' + result.message;
            }
        }
    </script>
</body>
</html>
"""

# Extract styling logic from profile.html to put in change-password.html
# profile.html has `.info-section` and `.info-item` CSS that we need for change password!
profile_extra_css = extract(profile, r'\s+\.info-section \{.*?\@media \(min-width: 1024px\) \{.*?\n\s+\}')

change_pwd = analytics.replace('<title>Analytics - LMS Solution</title>', '<title>Change Password - LMS Solution</title>')
change_pwd = re.sub(r'    <!-- Main Content -->.*', pw_main.replace('\\', r'\\'), change_pwd, flags=re.DOTALL)
change_pwd = change_pwd.replace(css_part, css_part + "\n" + profile_extra_css)

with open('change-password.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(change_pwd)

print("Synchronized correctly!")
