/* ==========================================================================
   TASKPULSE PRO - STATE MANAGEMENT & INTERACTION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // State Initialization
  let tasks = JSON.parse(localStorage.getItem('taskpulse_tasks')) || [
    { id: 1, title: 'Architect microservice event bus', category: 'Work', priority: 'High', completed: false, createdAt: 'Oct 12, 09:30 AM' },
    { id: 2, title: 'Review Q4 security vulnerability patches', category: 'Urgent', priority: 'High', completed: true, createdAt: 'Oct 11, 02:15 PM' },
    { id: 3, title: 'Deploy portfolio landing page to GitHub', category: 'Innovation', priority: 'Medium', completed: false, createdAt: 'Oct 10, 11:00 AM' }
  ];

  let currentFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const taskForm = document.getElementById('taskForm');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskCategoryInput = document.getElementById('taskCategoryInput');
  const taskPriorityInput = document.getElementById('taskPriorityInput');
  const tasksContainer = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.getElementById('filterTabs');
  
  // Analytics & Stats Elements
  const totalCountEl = document.getElementById('totalCount');
  const completedCountEl = document.getElementById('completedCount');
  const pendingCountEl = document.getElementById('pendingCount');
  const progressPercentageEl = document.getElementById('progressPercentage');
  const progressBarFill = document.getElementById('progressBarFill');
  const visibleCountEl = document.getElementById('visibleCount');

  // Action Buttons
  const exportBtn = document.getElementById('exportBtn');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const toastNotification = document.getElementById('toastNotification');

  // Helper: Show Toast Notification
  function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3000);
  }

  // Save to LocalStorage
  function saveTasks() {
    localStorage.setItem('taskpulse_tasks', JSON.stringify(tasks));
  }

  // Render Analytics & Progress
  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalCountEl.textContent = total;
    completedCountEl.textContent = completed;
    pendingCountEl.textContent = pending;
    progressPercentageEl.textContent = `${percentage}%`;
    progressBarFill.style.width = `${percentage}%`;
  }

  // Render Tasks List
  function renderTasks() {
    renderStats();

    // Filter Logic
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (currentFilter === 'pending') return !task.completed && matchesSearch;
      if (currentFilter === 'completed') return task.completed && matchesSearch;
      return matchesSearch;
    });

    visibleCountEl.textContent = filtered.length;

    if (filtered.length === 0) {
      tasksContainer.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tasksContainer.innerHTML = filtered.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-action="toggle">
          <div class="task-details">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-meta-tags">
              <span class="badge badge-${task.category}">${task.category}</span>
              <span class="badge badge-priority-${task.priority}">${task.priority}</span>
              <span class="task-date"><i class="fa-regular fa-clock"></i> ${task.createdAt}</span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn delete" data-action="delete" title="Delete Task">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Helper to prevent XSS
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Add Task Event
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const now = new Date();
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formattedDate = now.toLocaleDateString('en-US', options);

    const newTask = {
      id: Date.now(),
      title: title,
      category: taskCategoryInput.value,
      priority: taskPriorityInput.value,
      completed: false,
      createdAt: formattedDate
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    taskTitleInput.value = '';
    showToast('Task successfully created!');
  });

  // Task Actions (Toggle Complete & Delete)
  tasksContainer.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    const taskId = Number(taskItem.getAttribute('data-id'));

    if (e.target.closest('[data-action="toggle"]') || e.target.classList.contains('task-checkbox')) {
      tasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      saveTasks();
      renderTasks();
    }

    if (e.target.closest('[data-action="delete"]')) {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      renderTasks();
      showToast('Task deleted successfully');
    }
  });

  // Search Input Handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });

  // Filter Tabs Handler
  filterTabs.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-tab')) return;
    
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');

    currentFilter = e.target.getAttribute('data-filter');
    renderTasks();
  });

  // Export Data JSON Handler
  exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `taskpulse_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Workspace data exported successfully!');
  });

  // Clear Completed Handler
  clearCompletedBtn.addEventListener('click', () => {
    const initialCount = tasks.length;
    tasks = tasks.filter(t => !t.completed);
    if (tasks.length < initialCount) {
      saveTasks();
      renderTasks();
      showToast('Completed tasks cleared');
    } else {
      showToast('No completed tasks to clear');
    }
  });

  // Initial Render on Load
  renderTasks();
});
