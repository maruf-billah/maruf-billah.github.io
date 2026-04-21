"""Strip duplicated navbar/sidebar/user inline CSS from all HTML pages.
Keeps only page-specific styles in each file's <style> block."""

import re, os, glob

BASE = r"d:\Antigravity\LMS-FE-Maruf"

# CSS selectors that are now in styles.css and should be removed from inline <style> blocks
SHARED_SELECTORS = [
    '.navbar', '.navbar-brand', '.menu-toggle', '.menu-toggle:hover',
    '.navbar-actions', '.navbar-user', '.navbar-user:hover',
    '.user-avatar', '.user-info', '.user-name', '.user-role',
    '.btn-nav', '.btn-nav:hover',
    '.sidebar', '.sidebar.active', '.sidebar-header', '.sidebar-logo',
    '.sidebar-nav', '.sidebar-link', '.sidebar-link:hover', '.sidebar-link.active',
    '.sidebar-link.parent-active', '.sidebar-sublink',
    '.sidebar-icon', '.sidebar-footer',
]

def remove_css_rule(css_text, selector):
    escaped = re.escape(selector)
    pattern = r'\s*' + escaped + r'\s*\{[^}]*\}\s*'
    return re.sub(pattern, '\n', css_text)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    style_pattern = re.compile(r'(<style>)(.*?)(</style>)', re.DOTALL)
    
    def replace_style(match):
        opening = match.group(1)
        css = match.group(2)
        closing = match.group(3)
        
        for sel in SHARED_SELECTORS:
            css = remove_css_rule(css, sel)
        
        # Remove @media (min-width: 640px) that only has .user-info
        css = re.sub(
            r'@media\s*\(min-width:\s*640px\)\s*\{\s*\.user-info\s*\{[^}]*\}\s*\}',
            '', css
        )
        
        # Clean @media (min-width: 1024px) blocks
        def clean_1024_media(m):
            block_content = m.group(1)
            for sel in ['.sidebar', '.main-content', '.menu-toggle']:
                block_content = remove_css_rule(block_content, sel)
            if block_content.strip() == '':
                return ''
            return '@media (min-width: 1024px) {' + block_content + '}'
        
        css = re.sub(
            r'@media\s*\(min-width:\s*1024px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}',
            clean_1024_media, css
        )
        
        # Clean @media (min-width: 640px) blocks
        def clean_640_media(m):
            block_content = m.group(1)
            block_content = remove_css_rule(block_content, '.user-info')
            if block_content.strip() == '':
                return ''
            return '@media (min-width: 640px) {' + block_content + '}'
        
        css = re.sub(
            r'@media\s*\(min-width:\s*640px\)\s*\{((?:[^{}]|\{[^{}]*\})*)\}',
            clean_640_media, css
        )
        
        css = re.sub(r'\n{3,}', '\n\n', css)
        
        if css.strip() == '':
            return ''
        
        return opening + css + closing
    
    new_content = style_pattern.sub(replace_style, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Updated: {os.path.basename(filepath)}")
    else:
        print(f"  No changes: {os.path.basename(filepath)}")

html_files = glob.glob(os.path.join(BASE, "*.html"))
skip = ['login.html', 'register.html', 'index.html']

print("Stripping duplicated inline CSS from HTML files...")
for f in sorted(html_files):
    basename = os.path.basename(f)
    if basename in skip:
        print(f"  Skipping: {basename}")
        continue
    process_file(f)

print("\nDone!")
