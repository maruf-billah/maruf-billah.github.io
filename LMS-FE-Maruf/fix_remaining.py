import os, glob

remaining = [
    r'd:\Antigravity\LMS-FE-Maruf\contents.html',
    r'd:\Antigravity\LMS-FE-Maruf\index.html',
    r'd:\Antigravity\LMS-FE-Maruf\permissions.html',
    r'd:\Antigravity\LMS-FE-Maruf\roles.html',
    r'd:\Antigravity\LMS-FE-Maruf\users.html',
]

for f in remaining:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    old = '\U0001f6aa Logout'
    new = '\U0001f6aa <span class="sidebar-btn-text">Logout</span>'
    updated = content.replace(old, new)
    if content != updated:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(updated)
        print('Updated:', os.path.basename(f))
    else:
        print('No emoji match, trying plain text:', os.path.basename(f))
        old2 = '>\n                🚪 Logout\n'
        new2 = '>\n                🚪 <span class="sidebar-btn-text">Logout</span>\n'
        updated2 = content.replace(old2, new2)
        if content != updated2:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(updated2)
            print('  -> Updated with alt pattern')

print('Done')
