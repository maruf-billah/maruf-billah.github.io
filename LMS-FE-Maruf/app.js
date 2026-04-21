// ============================================
// LMS Solution - Core JavaScript
// ============================================

// Role-based menu configuration with parent-child structure
const menuConfig = {
  admin: [
    { icon: '🏠', label: 'Home', href: 'landing.html' },
    { icon: '📊', label: 'Analytics', href: 'analytics.html' },
    { icon: '📚', label: 'Courses', href: 'courses.html' },
    { icon: '📄', label: 'Reports', href: 'reports.html' },
    { icon: '🎓', label: 'Certificate Search', href: 'certificate-search.html' },
    {
      icon: '⚙️', label: 'Settings', children: [
        { icon: '👤', label: 'Users', href: 'settings.html#users' },
        { icon: '🔐', label: 'Roles & Permissions', href: 'settings.html#roles' },
        { icon: '📚', label: 'Course Management', href: 'settings.html#courses' },
        { icon: '📦', label: 'Module Management', href: 'settings.html#modules' },
        { icon: '❓', label: 'Questions Bank', href: 'settings.html#questions' },
        { icon: '📝', label: 'Exam Setup', href: 'settings.html#exams' }
      ]
    },
    { icon: '👤', label: 'Profile', href: 'profile.html' }
  ],
  headoffice: [
    { icon: '🏠', label: 'Home', href: 'landing.html' },
    { icon: '📊', label: 'Analytics', href: 'analytics.html' },
    { icon: '📚', label: 'Courses', href: 'courses.html' },
    { icon: '📄', label: 'Reports', href: 'reports.html' },
    { icon: '👤', label: 'Profile', href: 'profile.html' }
  ],
  territorymanager: [
    { icon: '🏠', label: 'Home', href: 'landing.html' },
    { icon: '📊', label: 'Analytics', href: 'analytics.html' },
    { icon: '📚', label: 'Courses', href: 'courses.html' },
    { icon: '📄', label: 'Reports', href: 'reports.html' },
    { icon: '👤', label: 'Profile', href: 'profile.html' }
  ],
  unitmanager: [
    { icon: '🏠', label: 'Home', href: 'landing.html' },
    { icon: '📊', label: 'Analytics', href: 'analytics.html' },
    { icon: '📚', label: 'Courses', href: 'courses.html' },
    { icon: '📄', label: 'Reports', href: 'reports.html' },
    { icon: '👤', label: 'Profile', href: 'profile.html' }
  ],
  ro: [
    { icon: '🏠', label: 'Home', href: 'landing.html' },
    { icon: '📊', label: 'Analytics', href: 'analytics.html' },
    { icon: '📚', label: 'Courses', href: 'courses.html' },
    { icon: '📄', label: 'Reports', href: 'reports.html' },
    { icon: '👤', label: 'Profile', href: 'profile.html' }
  ],
  beneficiary: [
    { icon: '📚', label: 'My Learning', href: 'courses.html' },
    { icon: '📊', label: 'My Progress', href: 'my-progress.html' },
    { icon: '👤', label: 'Profile', href: 'profile.html' },
    { icon: '🎓', label: 'My Certificates', href: 'certificate.html' }
  ]
};

// Check authentication
function checkAuth() {
  // Skip auth check on login and register pages to prevent redirect loop
  const currentPage = window.location.pathname.split('/').pop() || '';
  if (currentPage === 'login.html' || currentPage === 'register.html') {
    return false;
  }

  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn || isLoggedIn !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Get current user role
function getUserRole() {
  return localStorage.getItem('userRole') || 'beneficiary';
}

// Get user name
function getUserName() {
  return localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

// Render sidebar menu based on role
function renderSidebar() {
  const role = getUserRole();
  const menuItems = menuConfig[role] || menuConfig.beneficiary;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash || '';
  const currentFullUrl = currentPage + currentHash;

  const sidebarNav = document.getElementById('sidebarNav');
  if (!sidebarNav) return;

  sidebarNav.innerHTML = menuItems.map(item => {
    if (item.children) {
      // Parent menu with children
      const childrenHtml = item.children.map(child => {
        const isActiveChild = (currentFullUrl === child.href) || (!currentHash && child.href === currentPage);
        return `
        <a href="${child.href}" class="sidebar-link ${isActiveChild ? 'active' : ''}" style="padding-left: 3rem; font-size: var(--text-sm);">
          <span class="sidebar-icon">${child.icon}</span>
          <span class="sidebar-text">${child.label}</span>
        </a>
      `}).join('');

      const isParentActive = item.children.some(child => (currentFullUrl === child.href) || (!currentHash && child.href === currentPage));

      return `
        <div class="sidebar-parent">
          <div class="sidebar-link ${isParentActive ? 'active' : ''}" onclick="toggleSubmenu(this)" style="cursor: pointer;">
            <span class="sidebar-icon">${item.icon}</span>
            <span class="sidebar-text">${item.label}</span>
            <span class="toggle-icon" style="margin-left: auto;">${isParentActive ? '▲' : '▼'}</span>
          </div>
          <div class="sidebar-submenu" style="display: ${isParentActive ? 'block' : 'none'};">
            ${childrenHtml}
          </div>
        </div>
      `;
    } else {
      // Regular menu item
      const isActive = (currentFullUrl === item.href) || (!currentHash && item.href === currentPage);
      return `
        <a href="${item.href}" class="sidebar-link ${isActive ? 'active' : ''}">
          <span class="sidebar-icon">${item.icon}</span>
          <span class="sidebar-text">${item.label}</span>
        </a>
      `;
    }
  }).join('');
}

// Toggle submenu
function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector('span:last-child');

  if (submenu.style.display === 'none') {
    submenu.style.display = 'block';
    arrow.textContent = '▲';
  } else {
    submenu.style.display = 'none';
    arrow.textContent = '▼';
  }
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');

  if (sidebar) {
    if (window.innerWidth >= 1024) {
      sidebar.classList.toggle('collapsed');
    } else {
      sidebar.classList.toggle('active');
      sidebar.classList.remove('collapsed');
    }
  }
}

// User Dropdown Toggle
function toggleUserDropdown(event) {
  event.stopPropagation();
  const userMenu = document.querySelector('.navbar-user');
  if (userMenu) {
    userMenu.classList.toggle('active');
  }
}

// Close Dropdown on outside click
document.addEventListener('click', (e) => {
  const userMenu = document.querySelector('.navbar-user');
  if (userMenu && !userMenu.contains(e.target)) {
    userMenu.classList.remove('active');
  }
});

// Close sidebar when clicking outside on mobile
function setupSidebarClose() {
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (sidebar && menuToggle) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('active');
        }
      }
    }
  });
}

// Initialize user info in navbar
function initUserInfo() {
  const userName = getUserName();
  const userRole = getUserRole();

  const userNameElement = document.getElementById('userName');
  const userRoleElement = document.getElementById('userRole');

  if (userNameElement) {
    userNameElement.textContent = userName.split('@')[0];
  }

  if (userRoleElement) {
    const roleLabels = {
      admin: 'Administrator',
      headoffice: 'Head Office',
      territorymanager: 'Territory Manager',
      unitmanager: 'Unit Manager',
      ro: 'Regional Officer',
      beneficiary: 'Beneficiary'
    };
    userRoleElement.textContent = roleLabels[userRole] || 'User';
  }
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Form validation helper
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('error');

      // Remove error class on input
      input.addEventListener('input', () => {
        input.classList.remove('error');
      }, { once: true });
    }
  });

  if (!isValid) {
    alert('Please fill in all required fields');
  }

  return isValid;
}

// Format date helper
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format number helper
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

// Calculate progress percentage
function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Demo data for charts and tables - persisted in localStorage
const _defaultDemoData = {
  users: [
    { id: 1, name: 'Admin User', mobile: '01700000001', email: 'admin@lms.com', role: 'admin', district: 'Chattogram', upazila: 'Hathazari', status: 'Active' },
    { id: 2, name: 'Head Office', mobile: '01700000002', email: 'ho@lms.com', role: 'headoffice', district: 'Chattogram', upazila: 'Patiya', status: 'Active' },
    { id: 3, name: 'Territory Manager', mobile: '01700000003', email: 'tm@lms.com', role: 'territorymanager', district: 'Feni', upazila: 'Feni Sadar', status: 'Active' },
    { id: 4, name: 'Unit Manager', mobile: '01700000004', email: 'um@lms.com', role: 'unitmanager', district: 'Cumilla', upazila: 'Cumilla Sadar', status: 'Active' },
    { id: 5, name: 'Regional Officer', mobile: '01700000005', email: 'ro@lms.com', role: 'ro', district: 'Tangail', upazila: 'Tangail Sadar', status: 'Active' },
    { id: 6, name: 'Beneficiary User', mobile: '01700000006', email: '', role: 'beneficiary', district: 'Narsingdi', upazila: 'Narsingdi Sadar', status: 'Active' }
  ],
  roles: [
    { id: 1, name: 'Administrator', key: 'admin', permissions: ['all'] },
    { id: 2, name: 'Head Office', key: 'headoffice', permissions: ['view_analytics', 'manage_courses', 'view_courses', 'view_reports', 'manage_content'] },
    { id: 3, name: 'Territory Manager', key: 'territorymanager', permissions: ['view_analytics', 'view_courses', 'view_reports'] },
    { id: 4, name: 'Unit Manager', key: 'unitmanager', permissions: ['view_analytics', 'view_courses', 'view_reports'] },
    { id: 5, name: 'Regional Officer', key: 'ro', permissions: ['view_courses', 'view_reports'] },
    { id: 6, name: 'Beneficiary', key: 'beneficiary', permissions: ['view_courses', 'take_exams', 'view_certificate'] }
  ],
  courses: [
    {
      id: 1, title: 'Digital Financial Literacy', description: 'Learn core financial concepts for the digital age',
      category: 'Financial Education', duration: '4 hrs 10 min', thumbnail: '',
      preExamId: 1, postExamId: 2, preExamMandatory: true, postExamMandatory: true,
      videoConfig: { allowSeek: true, allowFastForward: true, subtitles: ['Bangla'] },
      modules: [
        { id: 1, title: 'Introduction to Financial Literacy', description: 'Understanding basic financial concepts and why they matter in everyday life.', duration: '45 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['আর্থিক সাক্ষরতার গুরুত্ব দৈনন্দিন জীবনে বোঝা', 'মৌলিক আর্থিক শব্দ ও ধারণা শেখা (আয়, ব্যয়, সঞ্চয়)', 'আর্থিক সিদ্ধান্তের দীর্ঘমেয়াদী প্রভাব বিশ্লেষণ করতে পারা', 'সাধারণ আর্থিক ভুলগুলো চিহ্নিত করা ও এড়ানো'], keyTopics: ['আর্থিক সাক্ষরতা কী?', 'কেন আর্থিক জ্ঞান দরকার', 'আয় বনাম ব্যয়', 'ভবিষ্যৎ পরিকল্পনা'] },
        { id: 2, title: 'Budgeting and Saving', description: 'Learn how to create a household budget and build saving habits.', duration: '50 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['পারিবারিক আয় ও ব্যয়ের হিসাব রাখা', 'মাসিক বাজেট তৈরি করা', 'সঞ্চয়ের অভ্যাস গড়ে তোলা', 'বাস্তবসম্মত আর্থিক লক্ষ্য নির্ধারণ করা'], keyTopics: ['আয় ও ব্যয়ের হিসাব', 'প্রথম বাজেট তৈরি', '৫০/৩০/২০ নিয়ম', 'সঞ্চয় কৌশল'] },
        { id: 3, title: 'Banking Services & Digital Payments', description: 'Explore mobile banking and digital payment services safely.', duration: '55 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['মোবাইল ব্যাংকিং অ্যাকাউন্ট খোলার নিয়ম জানা', 'নিরাপদ পিন সেট করা ও গোপন রাখা', 'বিকাশ/নগদ/রকেট দিয়ে টাকা পাঠানো', 'এজেন্ট পয়েন্ট থেকে ক্যাশআউটের নিয়ম'], keyTopics: ['বিকাশ রেজিস্ট্রেশন', 'পিন নিরাপত্তা', 'সেন্ড মানি', 'ক্যাশআউট'] },
        { id: 4, title: 'Remittance Management', description: 'Best practices for sending and receiving remittances.', duration: '40 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['রেমিট্যান্স প্রেরণ ও গ্রহণের সঠিক পদ্ধতি জানা', 'মোবাইল ও ব্যাংক চ্যানেলে রেমিট্যান্স তুলনা করা', 'প্রতারণা থেকে নিজেকে রক্ষা করা', 'রেমিট্যান্সের খরচ কমানোর উপায় খোঁজা'], keyTopics: ['রেমিট্যান্স কী?', 'চ্যানেল তুলনা', 'প্রতারণা সতর্কতা', 'খরচ কমানোর টিপস'] }
      ]
    },
    {
      id: 2, title: 'Investment & Insurance Basics', description: 'Understanding investment options and insurance fundamentals.',
      category: 'Financial Education', duration: '3 hrs', thumbnail: '',
      preExamId: null, postExamId: null, preExamMandatory: false, postExamMandatory: false,
      videoConfig: { allowSeek: true, allowFastForward: true, subtitles: ['Bangla', 'English'] },
      modules: [
        { id: 1, title: 'Introduction to Investment', description: 'Basic investment concepts you need to know.', duration: '50 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['Understand investment types', 'Savings vs Investment differences', 'Risk and return concepts', 'Starting small investments'], keyTopics: ['Savings vs Investment', 'Risk Types', 'Investment Basics', 'Return on Investment'] },
        { id: 2, title: 'Understanding Insurance', description: 'Insurance fundamentals and why they matter.', duration: '45 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumbnail: '', type: 'Video Lesson', learningObjectives: ['Know insurance types', 'Understand life insurance', 'Health insurance basics', 'Claims process'], keyTopics: ['Life Insurance', 'Health Insurance', 'Claims Process', 'Premium Calculation'] },
        { id: 3, title: 'Practical Financial Planning', description: 'Step-by-step guide to create your financial plan.', duration: '45 min', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', thumbnail: '', type: 'Reading Material', learningObjectives: ['Create a financial plan', 'Set realistic goals', 'Track progress effectively', 'Adjust plans over time'], keyTopics: ['Goal Setting', 'Risk Assessment', 'Plan Review', 'Long-term Strategy'] }
      ]
    }
  ],
  questions: [
    { id: 1, text: 'What is financial literacy?', options: ['Knowledge of managing money', 'Ability to read', 'Knowledge of science', 'Sports skill'], correct: 0, category: 'Financial Basics' },
    { id: 2, text: 'What is the purpose of a budget?', options: ['Plan income and expenses', 'Increase debt', 'Reduce savings', 'Avoid taxes'], correct: 0, category: 'Budgeting' },
    { id: 3, text: 'Which is a type of digital payment?', options: ['bKash', 'Postal Mail', 'Telegram', 'Fax'], correct: 0, category: 'Digital Payments' },
    { id: 4, text: 'What is a remittance?', options: ['Money sent to family abroad', 'A tax payment', 'A loan', 'Insurance premium'], correct: 0, category: 'Remittance' },
    { id: 5, text: 'What is compound interest?', options: ['Interest on interest', 'Simple calculation', 'Tax rate', 'Loan penalty'], correct: 0, category: 'Financial Basics' },
    { id: 6, text: 'What is a savings account?', options: ['Account for depositing money', 'A credit card', 'A loan', 'An investment bond'], correct: 0, category: 'Banking' },
    { id: 7, text: 'What is an emergency fund?', options: ['Money saved for unexpected expenses', 'A government grant', 'A business loan', 'Insurance payout'], correct: 0, category: 'Budgeting' },
    { id: 8, text: 'Which is a safe practice for mobile banking?', options: ['Using a strong PIN', 'Sharing your PIN', 'Using public WiFi', 'Writing PIN on phone case'], correct: 0, category: 'Digital Payments' }
  ],
  exams: [
    { id: 1, name: 'DFL Pre-Test', type: 'pre', courseId: 1, questionIds: [1, 2, 3, 4], timeLimit: 15, passMark: 0, canRetake: true },
    { id: 2, name: 'DFL Post-Test', type: 'post', courseId: 1, questionIds: [1, 2, 3, 4, 5, 6, 7, 8], timeLimit: 30, passMark: 50, canRetake: true }
  ],
  sessions: [
    { id: 1, name: 'Financial Literacy Workshop - Chattogram', date: '2026-01-10', district: 'Chattogram', upazila: 'Hathazari', union: 'Ashulia', unitOffice: 'Chattogram Central', participants: 45, male: 20, female: 25, unitManager: 'Karim Rahman', status: 'Completed' },
    { id: 2, name: 'Digital Banking Training - Feni', date: '2026-01-08', district: 'Feni', upazila: 'Feni Sadar', union: 'Betagi', unitOffice: 'Feni South', participants: 38, male: 18, female: 20, unitManager: 'Fatima Begum', status: 'Completed' }
  ],
  districts: ['Chattogram', 'Feni', 'Cumilla', 'Munshiganj', 'Narsingdi', 'Tangail'],
  upazilas: {
    'Chattogram': ['Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda'],
    'Feni': ['Chhagalnaiya', 'Daganbhuiyan', 'Feni Sadar', 'Fulgazi', 'Parshuram', 'Sonagazi'],
    'Cumilla': ['Barura', 'Brahmanpara', 'Burichung', 'Chandina', 'Chauddagram', 'Cumilla Sadar', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Meghna', 'Muradnagar', 'Nangalkot', 'Titas'],
    'Munshiganj': ['Gazaria', 'Lohajang', 'Munshiganj Sadar', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
    'Narsingdi': ['Belabo', 'Monohardi', 'Narsingdi Sadar', 'Palash', 'Raipura', 'Shibpur'],
    'Tangail': ['Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Tangail Sadar']
  }
};

// Load/Save data with localStorage persistence
function _loadData() {
  const saved = localStorage.getItem('lmsDemoData');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  return null;
}

function _saveData() {
  localStorage.setItem('lmsDemoData', JSON.stringify(demoData));
}

const demoData = _loadData() || JSON.parse(JSON.stringify(_defaultDemoData));

// CRUD helpers
function getNextId(arr) {
  if (!arr || arr.length === 0) return 1;
  return Math.max(...arr.map(x => x.id || 0)) + 1;
}

function addItem(collection, data) {
  data.id = getNextId(demoData[collection]);
  demoData[collection].push(data);
  _saveData();
  return data;
}

function updateItem(collection, id, data) {
  const idx = demoData[collection].findIndex(x => x.id === id);
  if (idx !== -1) {
    const existing = demoData[collection][idx];
    Object.assign(existing, data);
    _saveData();
    return existing;
  }
  return null;
}

function deleteItem(collection, id) {
  demoData[collection] = demoData[collection].filter(x => x.id !== id);
  _saveData();
}

// Pagination
const _paginationState = {};
function paginate(items, key, pageSize) {
  const page = _paginationState[key] || 1;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  _paginationState[key] = safePage;
  const start = (safePage - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), page: safePage, totalPages, total, size: pageSize };
}

function goToPage(key, p, renderFn) {
  _paginationState[key] = p;
  if (typeof window[renderFn] === 'function') window[renderFn]();
}

function renderPaginationControls(key, pg, renderFn) {
  if (pg.totalPages <= 1) return '';
  let html = '<div style="display:flex;gap:var(--space-xs);margin-top:var(--space-lg);justify-content:center;flex-wrap:wrap;">';
  for (let i = 1; i <= pg.totalPages; i++) {
    html += '<button class="btn btn-sm ' + (i === pg.page ? 'btn-primary' : 'btn-secondary') + '" onclick="goToPage(\'' + key + '\',' + i + ',\'' + renderFn + '\')">' + i + '</button>';
  }
  html += '</div>';
  return html;
}

// Password management (demo)
function resetUserPassword(mobile) {
  const passwords = JSON.parse(localStorage.getItem('lmsPasswords') || '{}');
  passwords[mobile] = 'lms@123';
  localStorage.setItem('lmsPasswords', JSON.stringify(passwords));
  return 'lms@123';
}

// Get module progress from localStorage
function getModuleProgress() {
  const progress = localStorage.getItem('moduleProgress');
  return progress ? JSON.parse(progress) : {};
}

// Save module progress
function saveModuleProgress(moduleId, completed) {
  const progress = getModuleProgress();
  progress[moduleId] = completed;
  localStorage.setItem('moduleProgress', JSON.stringify(progress));
}

// Check if all modules completed for a specific course
function allModulesCompleted(courseId) {
  const progress = getModuleProgress();
  if (courseId) {
    const course = demoData.courses.find(c => c.id === courseId);
    if (!course) return false;
    return course.modules.every(m => progress[courseId + '_' + m.id] === true);
  }
  // Check all courses
  return demoData.courses.every(c => c.modules.every(m => progress[c.id + '_' + m.id] === true));
}

// --- Enrollment Management ---
function getEnrollments() {
  return JSON.parse(localStorage.getItem('lmsEnrollments') || '{}');
}
function enrollInCourse(courseId) {
  const enrollments = getEnrollments();
  enrollments[courseId] = { enrolled: true, date: new Date().toISOString() };
  localStorage.setItem('lmsEnrollments', JSON.stringify(enrollments));
}
function isEnrolled(courseId) {
  const enrollments = getEnrollments();
  return enrollments[courseId] && enrollments[courseId].enrolled;
}

// --- Course-scoped progress ---
function getCourseProgress(courseId) {
  const progress = getModuleProgress();
  const result = {};
  const course = demoData.courses.find(c => c.id === courseId);
  if (!course) return result;
  course.modules.forEach(m => {
    result[m.id] = progress[courseId + '_' + m.id] === true;
  });
  return result;
}

// --- Exam attempt tracking ---
function getExamAttempts(examId, courseId) {
  const history = JSON.parse(localStorage.getItem('examHistory') || '[]');
  return history.filter(h => {
    if (examId && h.examId != examId) return false;
    if (courseId && h.courseId != courseId) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}
function getLatestExamScore(examId, courseId) {
  const attempts = getExamAttempts(examId, courseId);
  return attempts.length > 0 ? attempts[0] : null;
}
function hasCompletedExam(examId, courseId) {
  // For pre-test: just needs to be completed (any score)
  return getExamAttempts(examId, courseId).length > 0;
}
function hasPassedExam(examId, courseId, passMark) {
  const latest = getLatestExamScore(examId, courseId);
  if (!latest) return false;
  return latest.percentage >= passMark;
}

// Render role switcher dropdown
function renderRoleSwitcher() {
  const container = document.getElementById('roleSwitcher');
  if (!container) return;
  const currentRole = getUserRole();
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'headoffice', label: 'Head Office' },
    { value: 'territorymanager', label: 'Territory Manager' },
    { value: 'unitmanager', label: 'Unit Manager' },
    { value: 'ro', label: 'RO' },
    { value: 'beneficiary', label: 'Beneficiary' }
  ];
  container.innerHTML = `
    <select class="form-select" style="font-size:var(--text-xs);padding:0.35rem 0.5rem;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:var(--radius-md);min-width:120px;" onchange="switchRole(this.value)">
      <option value="" style="color:#333;">🔄 Switch Role</option>
      ${roles.map(r => `<option value="${r.value}" style="color:#333;" ${r.value === currentRole ? 'selected' : ''}>${r.label}</option>`).join('')}
    </select>
  `;
}

function switchRole(newRole) {
  if (newRole) {
    localStorage.setItem('userRole', newRole);
    const roleNames = { admin: 'Admin', headoffice: 'Head Office', territorymanager: 'Territory Manager', unitmanager: 'Unit Manager', ro: 'RO', beneficiary: 'Beneficiary' };
    localStorage.setItem('userName', roleNames[newRole] || newRole);
    window.location.reload();
  }
}

// Initialize page
function initPage() {
  // Check authentication
  if (!checkAuth()) return;

  // Initialize UI components
  renderSidebar();
  initUserInfo();
  setupSidebarClose();
  renderRoleSwitcher();

  // Update user avatar with profile pic if available
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    const savedPic = localStorage.getItem('userProfilePic');
    if (savedPic) {
      avatarEl.innerHTML = `<img src="${savedPic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarEl.textContent = getUserName().charAt(0).toUpperCase();
    }
  }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
