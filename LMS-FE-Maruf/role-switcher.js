// Global role switcher function for all pages
function switchRole(newRole) {
    if (newRole) {
        localStorage.setItem('userRole', newRole);
        localStorage.setItem('userName', newRole.charAt(0).toUpperCase() + newRole.slice(1));
        window.location.reload();
    }
}

// Add role switcher HTML to navbar (call this after page load)
function addRoleSwitcher() {
    const navbarActions = document.querySelector('.navbar-actions');
    if (!navbarActions) return;

    // Check if role switcher already exists
    if (document.getElementById('roleSwitcher')) return;

    const roleSwitcherHTML = `
    <select class="form-select" style="font-size: var(--text-sm); padding: 0.5rem;" onchange="switchRole(this.value)" id="roleSwitcher">
      <option value="">🔄 Switch Role</option>
      <option value="admin">Admin</option>
      <option value="headoffice">Head Office</option>
      <option value="territorymanager">Territory Manager</option>
      <option value="unitmanager">Unit Manager</option>
      <option value="ro">RO</option>
      <option value="beneficiary">Beneficiary</option>
    </select>
  `;

    // Insert before the first child of navbar-actions
    navbarActions.insertAdjacentHTML('afterbegin', roleSwitcherHTML);
}

// Auto-add role switcher on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addRoleSwitcher);
} else {
    addRoleSwitcher();
}
