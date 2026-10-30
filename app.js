/**
 * app.js - Core Application Logic
 * Handles Task CRUD, Deadline Calculations, Urgency Color Highlights,
 * Subtext Metadata Rendering, Filter/Search/Sort, and Light/Dark Themes.
 */

// ============================================================================
// State Management
// ============================================================================
let currentTasks = [];
let activeFilter = 'all';
let searchQuery = '';
let currentSort = 'deadline-asc';
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const authGateBanner = document.getElementById('authGateBanner');
const bannerGoogleSignInBtn = document.getElementById('bannerGoogleSignInBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDeadlineInput = document.getElementById('taskDeadlineInput');
const taskNotesInput = document.getElementById('taskNotesInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateDesc = document.getElementById('emptyStateDesc');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterButtons = document.querySelectorAll('.filter-btn');

// Stats DOM
const statTotal = document.getElementById('statTotal');
const statUrgent = document.getElementById('statUrgent');
const statMedium = document.getElementById('statMedium');
const statLater = document.getElementById('statLater');
const statCompleted = document.getElementById('statCompleted');

// Header & Navigation Action DOM
const btnExcelDbModal = document.getElementById('btnExcelDbModal');
const btnCompletedModal = document.getElementById('btnCompletedModal');
const headerCompletedCount = document.getElementById('headerCompletedCount');
const filterCompletedCount = document.getElementById('filterCompletedCount');

// Completed Tasks Banner & Controls
const completedViewBanner = document.getElementById('completedViewBanner');
const bannerCompletedCount = document.getElementById('bannerCompletedCount');
const btnExportCompletedBanner = document.getElementById('btnExportCompletedBanner');
const btnClearCompletedBanner = document.getElementById('btnClearCompletedBanner');
const btnExitCompletedBanner = document.getElementById('btnExitCompletedBanner');

// Toolbar Quick Excel Actions
const btnQuickExportExcel = document.getElementById('btnQuickExportExcel');
const btnQuickImportExcel = document.getElementById('btnQuickImportExcel');
const quickExcelFileInput = document.getElementById('quickExcelFileInput');

// Interactive Stat Cards
const cardStatTotal = document.getElementById('cardStatTotal');
const cardStatUrgent = document.getElementById('cardStatUrgent');
const cardStatMedium = document.getElementById('cardStatMedium');
const cardStatLater = document.getElementById('cardStatLater');
const cardStatCompleted = document.getElementById('cardStatCompleted');

// Excel Database Hub Modal
const excelModal = document.getElementById('excelModal');
const closeExcelModalBtn = document.getElementById('closeExcelModalBtn');
const closeExcelModalFooterBtn = document.getElementById('closeExcelModalFooterBtn');
const excelDbTaskCount = document.getElementById('excelDbTaskCount');
const btnExportExcelMain = document.getElementById('btnExportExcelMain');
const btnSaveLocalDiskExcel = document.getElementById('btnSaveLocalDiskExcel');
const excelDropZone = document.getElementById('excelDropZone');
const dropzonePrompt = document.getElementById('dropzonePrompt');
const btnBrowseExcel = document.getElementById('btnBrowseExcel');
const excelModalFileInput = document.getElementById('excelModalFileInput');
const dropzoneSelectedFile = document.getElementById('dropzoneSelectedFile');
const selectedExcelFileName = document.getElementById('selectedExcelFileName');
const btnRemoveSelectedFile = document.getElementById('btnRemoveSelectedFile');
const btnExecuteImportExcel = document.getElementById('btnExecuteImportExcel');
const chkAutoExcelPrompt = document.getElementById('chkAutoExcelPrompt');

// Completed Tasks Archive Modal
const completedTasksModal = document.getElementById('completedTasksModal');
const closeCompletedModalBtn = document.getElementById('closeCompletedModalBtn');
const closeCompletedModalFooterBtn = document.getElementById('closeCompletedModalFooterBtn');
const modalCompletedTotal = document.getElementById('modalCompletedTotal');
const modalCompletedOnTime = document.getElementById('modalCompletedOnTime');
const modalCompletedOverdue = document.getElementById('modalCompletedOverdue');
const completedModalSearchInput = document.getElementById('completedModalSearchInput');
const completedModalList = document.getElementById('completedModalList');
const completedModalEmpty = document.getElementById('completedModalEmpty');
const btnModalExportCompletedExcel = document.getElementById('btnModalExportCompletedExcel');
const btnModalClearCompleted = document.getElementById('btnModalClearCompleted');

// Confirmation Modal
const confirmModal = document.getElementById('confirmModal');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const acceptConfirmBtn = document.getElementById('acceptConfirmBtn');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
let pendingConfirmAction = null;
let stagedExcelFile = null;

// Modals
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTaskId = document.getElementById('editTaskId');
const editTitleInput = document.getElementById('editTitleInput');
const editDeadlineInput = document.getElementById('editDeadlineInput');
const editNotesInput = document.getElementById('editNotesInput');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const settingsModal = document.getElementById('settingsModal');
const btnSettingsModal = document.getElementById('btnSettingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const saveFirebaseBtn = document.getElementById('saveFirebaseBtn');
const resetFirebaseBtn = document.getElementById('resetFirebaseBtn');
const firebaseConfigInput = document.getElementById('firebaseConfigInput');
const toastContainer = document.getElementById('toastContainer');

// ============================================================================
// Theme Management (Light & Dark)
// ============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('taskflow_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(initialTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('taskflow_theme', theme);
  if (theme === 'dark') {
    themeIcon.textContent = '🌙';
    themeToggleBtn.title = 'Switch to Light Theme';
  } else {
    themeIcon.textContent = '☀️';
    themeToggleBtn.title = 'Switch to Dark Theme';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`);
}

// ============================================================================
// User Storage & Task Persistence (Per-User Isolation)
// ============================================================================
function getStorageKey() {
  if (currentUser && currentUser.uid) {
    return `taskflow_tasks_${currentUser.uid}`;
  }
  return 'taskflow_tasks_guest';
}

function loadTasks() {
  const key = getStorageKey();
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      currentTasks = JSON.parse(raw);
    } catch (e) {
      currentTasks = [];
    }
  } else {
    // If empty for a new user, inject sample tasks demonstrating urgency rules
    if (currentUser) {
      currentTasks = generateSampleTasks();
      saveTasks();
    } else {
      currentTasks = [];
    }
  }
  renderTasks();
  updateStats();
}

function saveTasks() {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(currentTasks));
  updateStats();
}

/**
 * Generate 3 initial sample tasks demonstrating each urgency rule:
 * - < 3 days: Red
 * - 3 to 10 days: Blue
 * - > 10 days: Yellow
 */
function generateSampleTasks() {
  const now = new Date();
  
  const urgentDate = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000); // 1.5 days (~36 hours)
  const mediumDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);   // 5 days
  const laterDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);   // 15 days

  return [
    {
      id: 'task_demo_1',
      title: 'Submit urgent project milestone',
      notes: 'Finalize presentation slides and push code repository.',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      deadline: urgentDate.toISOString(),
      completed: false
    },
    {
      id: 'task_demo_2',
      title: 'Review team pull requests and documentation',
      notes: 'Verify test coverage and update deployment handbook.',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      deadline: mediumDate.toISOString(),
      completed: false
    },
    {
      id: 'task_demo_3',
      title: 'Renew annual cloud subscriptions',
      notes: 'Audit active cloud resources and renew domain licenses.',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      deadline: laterDate.toISOString(),
      completed: false
    },
    {
      id: 'task_demo_4',
      title: 'Complete project environment setup',
      notes: 'Configured local web server and verified Google Auth connection.',
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      completed: true,
      completedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()
    }
  ];
}

// ============================================================================
// Deadline Urgency Calculation Engine
// Rule Specifications:
// - < 3 days: Urgent, highlighted as Red
// - > 3 days (up to 10 days): Medium, highlighted as Blue
// - > 10 days: Later, highlighted as Yellow
// ============================================================================
function getUrgencyInfo(deadlineStr, completed = false) {
  if (completed) {
    return {
      tier: 'completed',
      cssClass: 'urgency-completed',
      badgeClass: 'badge-completed',
      badgeLabel: 'Done',
      badgeIcon: '✓'
    };
  }

  const now = new Date();
  const deadlineDate = new Date(deadlineStr);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Less than 3 days (including overdue)
  if (diffDays < 3) {
    const isOverdue = diffMs < 0;
    return {
      tier: 'urgent',
      cssClass: 'urgency-red',
      badgeClass: 'badge-urgent',
      badgeLabel: isOverdue ? 'Overdue (< 3d)' : 'Urgent (< 3 days)',
      badgeIcon: '🚨',
      diffDays: diffDays
    };
  }

  // Between 3 and 10 days
  if (diffDays <= 10) {
    return {
      tier: 'medium',
      cssClass: 'urgency-blue',
      badgeClass: 'badge-medium',
      badgeLabel: 'Upcoming (3-10 days)',
      badgeIcon: '📅',
      diffDays: diffDays
    };
  }

  // Greater than 10 days
  return {
    tier: 'later',
    cssClass: 'urgency-yellow',
    badgeClass: 'badge-later',
    badgeLabel: 'Later (> 10 days)',
    badgeIcon: '⏳',
    diffDays: diffDays
  };
}

// ============================================================================
// Date Formatting Helpers
// ============================================================================
function formatDateTime(dateInput) {
  if (!dateInput) return 'Not set';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(deadlineStr) {
  const now = new Date();
  const target = new Date(deadlineStr);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays <= 0 ? 'Overdue today' : `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
  }

  if (diffHours < 24) {
    return diffHours <= 1 ? 'due in < 1 hour' : `due in ${diffHours} hours`;
  }

  return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
}

// Convert date to datetime-local input string format: YYYY-MM-DDTHH:MM
function toLocalDatetimeString(date) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// ============================================================================
// UI Rendering
// ============================================================================
function renderTasks() {
  taskList.innerHTML = '';

  // Show or hide dedicated Completed Tasks banner
  if (completedViewBanner) {
    if (activeFilter === 'completed') {
      completedViewBanner.style.display = 'flex';
    } else {
      completedViewBanner.style.display = 'none';
    }
  }

  // Filter tasks
  let filtered = currentTasks.filter((task) => {
    // Search query match
    if (searchQuery) {
      const matchTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNotes = (task.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchNotes) return false;
    }

    // Urgency & Status filter
    const urgency = getUrgencyInfo(task.deadline, task.completed);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    if (activeFilter === 'urgent') return urgency.tier === 'urgent' && !task.completed;
    if (activeFilter === 'medium') return urgency.tier === 'medium' && !task.completed;
    if (activeFilter === 'later') return urgency.tier === 'later' && !task.completed;

    return true;
  });

  // Sort tasks
  filtered.sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();

    switch (currentSort) {
      case 'deadline-asc':
        return dateA - dateB;
      case 'deadline-desc':
        return dateB - dateA;
      case 'created-desc':
        return createdB - createdA;
      case 'created-asc':
        return createdA - createdB;
      case 'title-asc':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Empty state handling
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    if (searchQuery) {
      emptyStateTitle.textContent = 'No matching tasks';
      emptyStateDesc.textContent = `No tasks matched your search for "${searchQuery}".`;
    } else if (activeFilter === 'completed') {
      emptyStateTitle.textContent = 'No completed tasks yet';
      emptyStateDesc.textContent = 'When you finish tasks and mark them complete, they will appear in this archive.';
    } else if (activeFilter !== 'all') {
      emptyStateTitle.textContent = 'No tasks in this category';
      emptyStateDesc.textContent = `No tasks currently match the "${activeFilter}" filter.`;
    } else {
      emptyStateTitle.textContent = 'Your work list is clear!';
      emptyStateDesc.textContent = 'Add a new work item above with a mandatory deadline to track it.';
    }
    return;
  } else {
    emptyState.style.display = 'none';
  }

  // Render cards
  filtered.forEach((task) => {
    const urgency = getUrgencyInfo(task.deadline, task.completed);
    const card = document.createElement('div');
    card.className = `task-card ${urgency.cssClass}`;
    card.dataset.id = task.id;

    const relativeStr = formatRelativeTime(task.deadline);
    const createdFormatted = formatDateTime(task.createdAt);
    const deadlineFormatted = formatDateTime(task.deadline);
    const completedFormatted = task.completed ? formatDateTime(task.completedAt || task.createdAt) : null;

    card.innerHTML = `
      <div class="task-checkbox-container">
        <input type="checkbox" class="custom-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete" onchange="toggleTaskComplete('${task.id}')">
      </div>

      <div class="task-body">
        <div class="task-header-row">
          <h4 class="task-title">${escapeHTML(task.title)}</h4>
          <span class="urgency-badge ${urgency.badgeClass}">
            ${urgency.badgeIcon} ${urgency.badgeLabel}
          </span>
        </div>

        ${task.notes ? `<p class="task-description">${escapeHTML(task.notes)}</p>` : ''}

        <!-- Placeholder Subtext for Created Date, Deadline & Completion -->
        <div class="task-meta-placeholder">
          ${task.completed ? `
            <span class="meta-pill completed-pill" title="Date this work item was marked as completed">
              ✅ Completed: <strong>${completedFormatted}</strong>
            </span>
          ` : ''}
          <span class="meta-pill created-pill" title="Date and time this work list was created">
            📅 Created: <strong>${createdFormatted}</strong>
          </span>
          <span class="meta-pill deadline-pill" title="Deadline for completion">
            ⏰ Deadline: <strong>${deadlineFormatted}</strong> (${task.completed ? 'Original Due' : relativeStr})
          </span>
        </div>
      </div>

      <div class="task-actions">
        ${task.completed ? `
          <button class="action-icon-btn reopen-btn" onclick="reopenTask('${task.id}')" title="Reopen / Mark as Active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>
        ` : `
          <button class="action-icon-btn" onclick="openEditModal('${task.id}')" title="Edit Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        `}
        <button class="action-icon-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    taskList.appendChild(card);
  });
}

function updateStats() {
  const total = currentTasks.length;
  let urgent = 0;
  let medium = 0;
  let later = 0;
  let completed = 0;

  currentTasks.forEach((task) => {
    if (task.completed) {
      completed++;
    } else {
      const u = getUrgencyInfo(task.deadline, false);
      if (u.tier === 'urgent') urgent++;
      else if (u.tier === 'medium') medium++;
      else if (u.tier === 'later') later++;
    }
  });

  if (statTotal) statTotal.textContent = total;
  if (statUrgent) statUrgent.textContent = urgent;
  if (statMedium) statMedium.textContent = medium;
  if (statLater) statLater.textContent = later;
  if (statCompleted) statCompleted.textContent = completed;

  if (headerCompletedCount) headerCompletedCount.textContent = completed;
  if (filterCompletedCount) filterCompletedCount.textContent = completed;
  if (bannerCompletedCount) bannerCompletedCount.textContent = completed;

  // Sync interactive stat card active highlight
  document.querySelectorAll('.stat-card.interactive').forEach((card) => {
    if (card.dataset.filterTarget === activeFilter) {
      card.classList.add('active-card');
    } else {
      card.classList.remove('active-card');
    }
  });

  // Update Excel modal counter if element exists
  if (excelDbTaskCount) {
    excelDbTaskCount.textContent = `${total} tasks (${completed} completed)`;
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ============================================================================
// Task CRUD Operations
// ============================================================================
function handleAddTask(e) {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  const deadline = taskDeadlineInput.value;
  const notes = taskNotesInput.value.trim();

  // Validate required inputs
  if (!title) {
    showToast('Please provide a title for the task.', 'error');
    taskTitleInput.focus();
    return;
  }

  if (!deadline) {
    showToast('Deadline is required! Please select a deadline date.', 'error');
    taskDeadlineInput.focus();
    return;
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    showToast('Please provide a valid deadline date.', 'error');
    return;
  }

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title,
    deadline: deadlineDate.toISOString(),
    notes: notes,
    createdAt: new Date().toISOString(),
    completed: false
  };

  currentTasks.unshift(newTask);
  saveTasks();
  renderTasks();

  // Reset form
  taskForm.reset();
  setDefaultDeadlineInput();

  const urgency = getUrgencyInfo(newTask.deadline, false);
  showToast(`Task added! Urgency level: ${urgency.badgeLabel}`);
}

function toggleTaskComplete(id) {
  const task = currentTasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date().toISOString();
      showToast('Task marked as completed! 🎉');
      checkAutoExcelPrompt();
    } else {
      delete task.completedAt;
      showToast('Task marked as active');
    }
    saveTasks();
    renderTasks();
    if (completedTasksModal && completedTasksModal.classList.contains('active')) {
      renderCompletedModalList();
    }
  }
}

function reopenTask(id) {
  const task = currentTasks.find((t) => t.id === id);
  if (task) {
    task.completed = false;
    delete task.completedAt;
    saveTasks();
    renderTasks();
    if (completedTasksModal && completedTasksModal.classList.contains('active')) {
      renderCompletedModalList();
    }
    showToast(`Reopened "${task.title}" to active list`);
  }
}

function clearCompletedTasks() {
  const completedCount = currentTasks.filter((t) => t.completed).length;
  if (completedCount === 0) {
    showToast('There are no completed tasks to clear.', 'info');
    return;
  }

  showConfirmDialog(
    'Clear All Completed Tasks?',
    `Are you sure you want to permanently delete all ${completedCount} completed task(s)? You can export them to Excel first to keep a backup.`,
    () => {
      currentTasks = currentTasks.filter((t) => !t.completed);
      saveTasks();
      renderTasks();
      if (completedTasksModal && completedTasksModal.classList.contains('active')) {
        renderCompletedModalList();
      }
      showToast(`Cleared ${completedCount} completed task(s)`);
      closeConfirmDialog();
    }
  );
}

function deleteTask(id) {
  const index = currentTasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    const deleted = currentTasks.splice(index, 1)[0];
    saveTasks();
    renderTasks();
    if (completedTasksModal && completedTasksModal.classList.contains('active')) {
      renderCompletedModalList();
    }
    showToast(`Deleted "${deleted.title}"`);
  }
}

function openEditModal(id) {
  const task = currentTasks.find((t) => t.id === id);
  if (!task) return;

  editTaskId.value = task.id;
  editTitleInput.value = task.title;
  editNotesInput.value = task.notes || '';

  // Format date for datetime-local
  const d = new Date(task.deadline);
  editDeadlineInput.value = toLocalDatetimeString(d);

  editModal.classList.add('active');
}

function closeEditModal() {
  editModal.classList.remove('active');
}

function handleEditSubmit(e) {
  e.preventDefault();
  const id = editTaskId.value;
  const task = currentTasks.find((t) => t.id === id);
  if (!task) return;

  const newTitle = editTitleInput.value.trim();
  const newDeadline = editDeadlineInput.value;
  const newNotes = editNotesInput.value.trim();

  if (!newTitle) {
    showToast('Task title cannot be empty', 'error');
    return;
  }
  if (!newDeadline) {
    showToast('Deadline is required', 'error');
    return;
  }

  task.title = newTitle;
  task.deadline = new Date(newDeadline).toISOString();
  task.notes = newNotes;

  saveTasks();
  renderTasks();
  closeEditModal();
  showToast('Task updated successfully!');
}

// ============================================================================
// Quick Deadline Helper Buttons (+1d, +2d, +5d, +14d)
// ============================================================================
function setupQuickDeadlineButtons() {
  document.querySelectorAll('.btn-quick-date').forEach((btn) => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days, 10);
      const target = new Date();
      target.setDate(target.getDate() + days);
      // Set to 5:00 PM by default for clear day bounds
      target.setHours(17, 0, 0, 0);
      taskDeadlineInput.value = toLocalDatetimeString(target);
      showToast(`Deadline set to ${days} day${days > 1 ? 's' : ''} from now`);
    });
  });
}

function setDefaultDeadlineInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(18, 0, 0, 0);
  taskDeadlineInput.value = toLocalDatetimeString(tomorrow);
}

// ============================================================================
// Google Authentication UI Controller
// ============================================================================
function updateAuthUI(user) {
  currentUser = user;

  if (user) {
    authGateBanner.style.display = 'none';
    authSection.innerHTML = `
      <div class="user-badge" title="Signed in with Google as ${user.email}">
        <img class="user-avatar" src="${user.photoURL}" alt="${user.displayName}">
        <div class="user-details">
          <span class="user-name">${user.displayName}</span>
          <span class="user-email">${user.email}</span>
        </div>
      </div>
      <button class="btn-signout" id="btnSignOut" title="Sign out of account">
        Sign Out
      </button>
    `;

    document.getElementById('btnSignOut').addEventListener('click', async () => {
      await window.authManager.signOut();
      showToast('Signed out successfully');
    });
  } else {
    authGateBanner.style.display = 'block';
    authSection.innerHTML = `
      <button id="btnHeaderGoogleSignIn" class="btn-google-signin">
        <svg viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27A7.03 7.03 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        Sign In with Google
      </button>
    `;

    document.getElementById('btnHeaderGoogleSignIn').addEventListener('click', handleGoogleSignInClick);
  }

  // Reload user's isolated task list
  loadTasks();
}

async function handleGoogleSignInClick() {
  const result = await window.authManager.signInWithGoogle();
  if (result.success) {
    showToast(`Welcome, ${result.user.displayName}!`);
  } else {
    if (result.error === 'FIREBASE_NOT_CONFIGURED') {
      showToast('Please add your free Firebase config to connect real Google Sign-In.', 'info');
      // Automatically open settings modal to assist the user
      btnSettingsModal.click();
    } else {
      showToast(result.error || 'Google sign-in cancelled or blocked', 'error');
    }
  }
}


// ============================================================================
// Confirmation Modal Helpers
// ============================================================================
function showConfirmDialog(title, message, onConfirm) {
  if (!confirmModal) return;
  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  pendingConfirmAction = onConfirm;
  confirmModal.classList.add('active');
}

function closeConfirmDialog() {
  if (!confirmModal) return;
  confirmModal.classList.remove('active');
  pendingConfirmAction = null;
}

// ============================================================================
// Auto-Export to Excel Notification Helper
// ============================================================================
function checkAutoExcelPrompt() {
  const enabled = localStorage.getItem('taskflow_auto_excel_prompt') === 'true';
  if (!enabled) return;
  
  setTimeout(() => {
    showToast('💡 Excel DB: Remember to export your updated tasks spreadsheet!', 'info');
  }, 1200);
}

// ============================================================================
// Completed Tasks Archive Modal Logic
// ============================================================================
function openCompletedModal() {
  renderCompletedModalList();
  completedTasksModal.classList.add('active');
}

function closeCompletedModal() {
  completedTasksModal.classList.remove('active');
  if (completedModalSearchInput) completedModalSearchInput.value = '';
}

function renderCompletedModalList() {
  const completed = currentTasks.filter((t) => t.completed);
  let onTime = 0;
  let overdue = 0;

  completed.forEach((t) => {
    const dl = new Date(t.deadline);
    const comp = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
    if (!isNaN(dl.getTime()) && !isNaN(comp.getTime()) && comp.getTime() <= dl.getTime()) {
      onTime++;
    } else {
      overdue++;
    }
  });

  if (modalCompletedTotal) modalCompletedTotal.textContent = completed.length;
  if (modalCompletedOnTime) modalCompletedOnTime.textContent = onTime;
  if (modalCompletedOverdue) modalCompletedOverdue.textContent = overdue;

  const query = (completedModalSearchInput?.value || '').trim().toLowerCase();
  const filtered = completed.filter((t) => {
    if (!query) return true;
    return t.title.toLowerCase().includes(query) || (t.notes || '').toLowerCase().includes(query);
  });

  completedModalList.innerHTML = '';
  if (filtered.length === 0) {
    completedModalEmpty.style.display = 'block';
    return;
  }
  completedModalEmpty.style.display = 'none';

  filtered.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'completed-item-card';

    const compDate = formatDateTime(task.completedAt || task.createdAt);
    const deadDate = formatDateTime(task.deadline);

    item.innerHTML = `
      <div class="completed-item-left">
        <h4 class="completed-item-title">${escapeHTML(task.title)}</h4>
        ${task.notes ? `<p class="completed-item-notes">${escapeHTML(task.notes)}</p>` : ''}
        <div class="completed-item-meta">
          <span class="meta-pill completed-pill">✅ Finished: ${compDate}</span>
          <span class="meta-pill">⏰ Original Deadline: ${deadDate}</span>
        </div>
      </div>
      <div class="completed-item-actions">
        <button class="btn-reopen-task" onclick="reopenTask('${task.id}')" title="Restore task to active list">
          ↩️ Reopen
        </button>
        <button class="action-icon-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete from archive">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
    completedModalList.appendChild(item);
  });
}

// ============================================================================
// Excel Database Hub Modal Logic
// ============================================================================
function openExcelModal() {
  updateStats();
  excelModal.classList.add('active');
  const savedPref = localStorage.getItem('taskflow_auto_excel_prompt');
  if (chkAutoExcelPrompt) chkAutoExcelPrompt.checked = savedPref === 'true';
}

function closeExcelModal() {
  excelModal.classList.remove('active');
  resetExcelDropzone();
}

function resetExcelDropzone() {
  stagedExcelFile = null;
  if (excelModalFileInput) excelModalFileInput.value = '';
  if (dropzonePrompt) dropzonePrompt.style.display = 'flex';
  if (dropzoneSelectedFile) dropzoneSelectedFile.style.display = 'none';
  if (btnExecuteImportExcel) btnExecuteImportExcel.disabled = true;
}

function stageExcelFile(file) {
  if (!file) return;
  stagedExcelFile = file;
  if (selectedExcelFileName) selectedExcelFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  if (dropzonePrompt) dropzonePrompt.style.display = 'none';
  if (dropzoneSelectedFile) dropzoneSelectedFile.style.display = 'flex';
  if (btnExecuteImportExcel) btnExecuteImportExcel.disabled = false;
}

function handleExportExcelFull() {
  if (!currentTasks.length) {
    showToast('There are no tasks to export.', 'info');
    return;
  }
  try {
    const result = window.excelDB.exportDatabase(currentTasks, { currentUser });
    showToast(`Excel database saved! (${result.totalCount} tasks in .xlsx)`);
  } catch (err) {
    showToast('Failed to export Excel: ' + err.message, 'error');
  }
}

async function handleSaveLocalDiskExcel() {
  if (!currentTasks.length) {
    showToast('There are no tasks to save.', 'info');
    return;
  }
  try {
    const result = await window.excelDB.saveToLocalDisk(currentTasks, { currentUser });
    if (result && result.success) {
      if (result.directSave) {
        showToast(`Saved directly to "${result.filename}" on disk!`);
      } else {
        showToast(`Excel database saved as "${result.filename}"!`);
      }
    }
  } catch (err) {
    showToast('Error saving to file: ' + err.message, 'error');
  }
}

function handleExportCompletedExcelOnly() {
  const completed = currentTasks.filter((t) => t.completed);
  if (!completed.length) {
    showToast('No completed tasks to export.', 'info');
    return;
  }
  try {
    const result = window.excelDB.exportCompletedArchive(completed);
    showToast(`Exported ${result.count} completed task(s) to Excel!`);
  } catch (err) {
    showToast('Failed to export completed archive: ' + err.message, 'error');
  }
}

async function executeExcelImport(file, mode = 'merge') {
  if (!file) {
    showToast('Please select an Excel file first.', 'error');
    return;
  }

  try {
    const parsed = await window.excelDB.parseExcelFile(file);
    const importedTasks = parsed.tasks;

    if (mode === 'replace') {
      currentTasks = importedTasks;
    } else {
      // Merge: update existing by ID or Title, append new ones
      importedTasks.forEach((imported) => {
        const existingIdx = currentTasks.findIndex((t) => 
          t.id === imported.id || t.title.toLowerCase().trim() === imported.title.toLowerCase().trim()
        );
        if (existingIdx !== -1) {
          currentTasks[existingIdx] = {
            ...currentTasks[existingIdx],
            ...imported,
            id: currentTasks[existingIdx].id
          };
        } else {
          currentTasks.push(imported);
        }
      });
    }

    saveTasks();
    renderTasks();
    closeExcelModal();

    const compCount = importedTasks.filter((t) => t.completed).length;
    showToast(`Loaded ${importedTasks.length} task(s) from Excel (${compCount} completed)!`);
  } catch (err) {
    showToast('Import error: ' + err.message, 'error');
  }
}

// ============================================================================
// Interactive Stat Cards Setup
// ============================================================================
function setupInteractiveStatCards() {
  document.querySelectorAll('.stat-card.interactive').forEach((card) => {
    card.addEventListener('click', () => {
      const targetFilter = card.dataset.filterTarget;
      if (!targetFilter) return;

      activeFilter = targetFilter;
      filterButtons.forEach((btn) => {
        if (btn.dataset.filter === targetFilter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      renderTasks();
      updateStats();

      if (targetFilter === 'completed') {
        showToast('Switched to Completed Tasks Archive ✅');
      }
    });
  });
}

// ============================================================================
// Setup Excel & Completed Listeners
// ============================================================================
function setupExcelAndCompletedListeners() {
  // Header Triggers
  if (btnExcelDbModal) btnExcelDbModal.addEventListener('click', openExcelModal);
  if (btnCompletedModal) btnCompletedModal.addEventListener('click', openCompletedModal);

  // Close Excel Modal
  if (closeExcelModalBtn) closeExcelModalBtn.addEventListener('click', closeExcelModal);
  if (closeExcelModalFooterBtn) closeExcelModalFooterBtn.addEventListener('click', closeExcelModal);

  // Export from Excel Modal
  if (btnExportExcelMain) btnExportExcelMain.addEventListener('click', handleExportExcelFull);
  if (btnSaveLocalDiskExcel) btnSaveLocalDiskExcel.addEventListener('click', handleSaveLocalDiskExcel);

  // Import from Excel Modal
  if (btnBrowseExcel && excelModalFileInput) {
    btnBrowseExcel.addEventListener('click', () => excelModalFileInput.click());
    excelModalFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        stageExcelFile(e.target.files[0]);
      }
    });
  }

  if (btnRemoveSelectedFile) {
    btnRemoveSelectedFile.addEventListener('click', resetExcelDropzone);
  }

  // Drag and drop on dropzone
  if (excelDropZone) {
    excelDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      excelDropZone.classList.add('drag-over');
    });
    excelDropZone.addEventListener('dragleave', () => {
      excelDropZone.classList.remove('drag-over');
    });
    excelDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      excelDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        stageExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Execute Import
  if (btnExecuteImportExcel) {
    btnExecuteImportExcel.addEventListener('click', () => {
      if (!stagedExcelFile) return;
      const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'merge';
      executeExcelImport(stagedExcelFile, mode);
    });
  }

  // Auto-backup toggle
  if (chkAutoExcelPrompt) {
    chkAutoExcelPrompt.addEventListener('change', (e) => {
      localStorage.setItem('taskflow_auto_excel_prompt', e.target.checked ? 'true' : 'false');
      showToast(e.target.checked ? 'Excel backup reminders enabled' : 'Excel backup reminders disabled');
    });
  }

  // Toolbar Quick Actions
  if (btnQuickExportExcel) btnQuickExportExcel.addEventListener('click', handleExportExcelFull);
  if (btnQuickImportExcel && quickExcelFileInput) {
    btnQuickImportExcel.addEventListener('click', () => quickExcelFileInput.click());
    quickExcelFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await executeExcelImport(e.target.files[0], 'merge');
        quickExcelFileInput.value = '';
      }
    });
  }

  // Completed Banner Actions
  if (btnExportCompletedBanner) btnExportCompletedBanner.addEventListener('click', handleExportCompletedExcelOnly);
  if (btnClearCompletedBanner) btnClearCompletedBanner.addEventListener('click', clearCompletedTasks);
  if (btnExitCompletedBanner) {
    btnExitCompletedBanner.addEventListener('click', () => {
      activeFilter = 'active';
      filterButtons.forEach((b) => {
        if (b.dataset.filter === 'active') b.classList.add('active');
        else b.classList.remove('active');
      });
      renderTasks();
      updateStats();
    });
  }

  // Completed Modal Controls
  if (closeCompletedModalBtn) closeCompletedModalBtn.addEventListener('click', closeCompletedModal);
  if (closeCompletedModalFooterBtn) closeCompletedModalFooterBtn.addEventListener('click', closeCompletedModal);
  if (btnModalExportCompletedExcel) btnModalExportCompletedExcel.addEventListener('click', handleExportCompletedExcelOnly);
  if (btnModalClearCompleted) btnModalClearCompleted.addEventListener('click', clearCompletedTasks);

  if (completedModalSearchInput) {
    completedModalSearchInput.addEventListener('input', () => renderCompletedModalList());
  }

  // Confirmation Modal Controls
  if (acceptConfirmBtn) {
    acceptConfirmBtn.addEventListener('click', () => {
      if (typeof pendingConfirmAction === 'function') {
        pendingConfirmAction();
      }
      closeConfirmDialog();
    });
  }
  if (cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', closeConfirmDialog);
  if (closeConfirmModalBtn) closeConfirmModalBtn.addEventListener('click', closeConfirmDialog);
}

// ============================================================================
// Firebase Settings Modal Handlers
// ============================================================================
function setupSettingsModal() {
  btnSettingsModal.addEventListener('click', () => {
    const saved = window.authManager.getSavedFirebaseConfig();
    if (saved) {
      firebaseConfigInput.value = JSON.stringify(saved, null, 2);
    } else {
      firebaseConfigInput.value = '';
    }
    settingsModal.classList.add('active');
  });

  closeSettingsModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

  saveFirebaseBtn.addEventListener('click', () => {
    const raw = firebaseConfigInput.value.trim();
    if (!raw) {
      showToast('Please paste a valid JSON Firebase configuration', 'error');
      return;
    }
    try {
      let cleaned = raw;
      // Strip 'const firebaseConfig = ' or 'var firebaseConfig = ' or 'let firebaseConfig = '
      cleaned = cleaned.replace(/^(const|var|let)\s+firebaseConfig\s*=\s*/i, '');
      // Strip trailing semicolon
      cleaned = cleaned.trim().replace(/;$/, '');
      
      let config;
      try {
        config = JSON.parse(cleaned);
      } catch (jsonErr) {
        // Fallback for unquoted keys: e.g. apiKey: "..." -> "apiKey": "..."
        const jsonReady = cleaned
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/,\s*([}\]])/g, '$1'); // trailing commas
        config = JSON.parse(jsonReady);
      }

      if (!config.apiKey || !config.authDomain) {
        showToast('Configuration seems incomplete. Must contain apiKey and authDomain.', 'error');
        return;
      }

      const ok = window.authManager.saveFirebaseConfig(config);
      if (ok) {
        showToast('Firebase configuration saved! Real Google Sign-In is now active.');
        settingsModal.classList.remove('active');
      } else {
        showToast('Error initializing Firebase with the provided configuration', 'error');
      }
    } catch (e) {
      showToast('Could not parse configuration: ' + e.message, 'error');
    }
  });

  resetFirebaseBtn.addEventListener('click', () => {
    localStorage.removeItem('todo_firebase_config');
    firebaseConfigInput.value = '';
    showToast('Firebase configuration cleared. Using demo accounts mode.');
  });
}

// ============================================================================
// Toast Notifications
// ============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'ℹ️';
  if (type === 'error') icon = '⚠️';
  else if (message.includes('completed') || message.includes('added') || message.includes('updated') || message.includes('saved') || message.includes('Loaded')) icon = '✅';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ============================================================================
// Event Listeners & Initialization
// ============================================================================
function initEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Form Submission
  taskForm.addEventListener('submit', handleAddTask);

  // Edit Form
  editForm.addEventListener('submit', handleEditSubmit);
  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Banner Sign In
  bannerGoogleSignInBtn.addEventListener('click', handleGoogleSignInClick);

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTasks();
  });

  // Sort Select
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks();
  });

  // Filter Buttons
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderTasks();
      updateStats();
    });
  });

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
    if (e.target === settingsModal) settingsModal.classList.remove('active');
    if (e.target === excelModal) closeExcelModal();
    if (e.target === completedTasksModal) closeCompletedModal();
    if (e.target === confirmModal) closeConfirmDialog();
  });

  setupQuickDeadlineButtons();
  setupSettingsModal();
  setupInteractiveStatCards();
  setupExcelAndCompletedListeners();
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setDefaultDeadlineInput();
  initEventListeners();

  // Listen for Google Auth state changes
  window.authManager.onAuthStateChanged((user) => {
    updateAuthUI(user);
  });
});
