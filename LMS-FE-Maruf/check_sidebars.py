import sys, re
sys.stdout.reconfigure(encoding='utf-8')
for f in ['analytics.html', 'reports.html', 'profile.html', 'change-password.html']:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        m = re.search(r'<aside class="sidebar".*?</aside>', content, re.DOTALL)
        print(f"\n--- {f} ---\n{m.group(0) if m else 'Not found'}")
