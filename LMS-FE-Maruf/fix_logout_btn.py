import os, glob

html_files = glob.glob(r'd:\Antigravity\LMS-FE-Maruf\*.html')
old = 'btn btn-danger btn-full" onclick="logout()">\U0001f6aa Logout<'
new = 'btn btn-danger btn-full" onclick="logout()">\U0001f6aa <span class="sidebar-btn-text">Logout</span><'

for f in html_files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if old in content:
        updated = content.replace(old, new)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(updated)
        print('Updated:', os.path.basename(f))

print('Done')
