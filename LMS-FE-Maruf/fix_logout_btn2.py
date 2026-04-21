import os, glob

html_files = [
    r'd:\Antigravity\LMS-FE-Maruf\landing.html',
    r'd:\Antigravity\LMS-FE-Maruf\analytics.html',
    r'd:\Antigravity\LMS-FE-Maruf\reports.html',
    r'd:\Antigravity\LMS-FE-Maruf\profile.html',
]

for f in html_files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    # Replace the button content - these pages have the button content on the next line
    old1 = '\U0001f6aa Logout'
    new1 = '\U0001f6aa <span class="sidebar-btn-text">Logout</span>'
    updated = content.replace(old1, new1)
    if content != updated:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(updated)
        print('Updated:', os.path.basename(f))
    else:
        print('No match in:', os.path.basename(f))

print('Done')
