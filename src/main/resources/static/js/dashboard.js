/* =========================================================
   Dashboard logic: stats, task list, add/edit/delete/toggle,
   rewards summary, notification polling.
   ========================================================= */

const user = requireAuth();
if (user) {
    initThemeFromUser();
    setupThemeToggleButton('themeToggleBtn');
    document.getElementById('greeting').textContent = `Hello, ${user.fullName.split(' ')[0]} 👋`;
}

let allTasks = [];

// ---------- Logout ----------
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('categoriesLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Categories are managed inline on each task (see the Category field when adding a task).');
});
document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'profile.html';
});

// ---------- Load everything ----------
async function loadDashboard() {
    await Promise.all([loadStats(), loadRewards(), loadTasks(), refreshNotifications()]);
}

async function loadStats() {
    try {
        const stats = await apiRequest(`/tasks/user/${user.userId}/stats`);
        document.getElementById('statTotal').textContent = stats.totalTasks;
        document.getElementById('statCompleted').textContent = stats.completed;
        document.getElementById('statPending').textContent = stats.pending;
        document.getElementById('progressFill').style.width = stats.progressPercent + '%';
    } catch (err) {
        console.error(err);
    }
}

async function loadRewards() {
    try {
        const summary = await apiRequest(`/rewards/user/${user.userId}`);
        document.getElementById('rewardPoints').textContent = summary.totalPoints;
        document.getElementById('badgeCount').textContent = summary.badgeCount;
        document.getElementById('stickerCount').textContent = summary.stickerCount;
        document.getElementById('statRewardPoints').textContent = summary.totalPoints;
    } catch (err) {
        console.error(err);
    }
}

async function loadTasks() {
    try {
        allTasks = await apiRequest(`/tasks/user/${user.userId}`);
        renderTasks();
    } catch (err) {
        console.error(err);
    }
}

function renderTasks() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;

    let filtered = allTasks.filter(t => {
        const matchesSearch = !search || t.title.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search)) ||
            (t.category && t.category.toLowerCase().includes(search));
        let matchesFilter = true;
        if (filter === 'Pending' || filter === 'Completed') matchesFilter = t.status === filter;
        if (filter === 'High' || filter === 'Medium' || filter === 'Low') matchesFilter = t.priority === filter;
        return matchesSearch && matchesFilter;
    });

    const list = document.getElementById('taskList');
    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="emoji">🗒️</div>No tasks here yet. Click "+ Add Task" to create one.</div>`;
        return;
    }

    list.innerHTML = filtered.map(t => `
        <div class="task-card priority-${t.priority} ${t.status === 'Completed' ? 'completed' : ''}" data-id="${t.taskId}">
            <button class="task-check" onclick="toggleTask(${t.taskId})">
                ${t.status === 'Completed' ? '↺ Mark Pending' : '✓ Mark Complete'}
            </button>
            <div class="task-body">
                <p class="task-title">${escapeHtml(t.title)}</p>
                <div class="task-meta">
                    <span class="badge ${t.priority}">${t.priority}</span>
                    ${t.category ? `<span>📁 ${escapeHtml(t.category)}</span>` : ''}
                    <span>📅 ${formatDate(t.dueDate)}${t.dueTime ? ' · ' + t.dueTime.slice(0,5) : ''}</span>
                </div>
            </div>
            <div class="task-actions">
                <button onclick="editTask(${t.taskId})" title="Edit">✏️</button>
                <button class="delete" onclick="deleteTask(${t.taskId})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('searchInput').addEventListener('input', renderTasks);
document.getElementById('filterSelect').addEventListener('change', renderTasks);

// ---------- Toggle complete ----------
async function toggleTask(taskId) {
    try {
        const result = await apiRequest(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
        if (result.pointsEarned > 0) {
            showRewardToast(result.pointsEarned, result.milestone);
        }
        await Promise.all([loadTasks(), loadStats(), loadRewards()]);
    } catch (err) {
        alert(err.message);
    }
}

// ---------- Delete ----------
async function deleteTask(taskId) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
        await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        alert('Could not delete task: ' + err.message);
    }
}

// ---------- Modal: Add / Edit ----------
const overlay = document.getElementById('taskModalOverlay');
const form = document.getElementById('taskForm');

document.getElementById('addTaskBtn').addEventListener('click', () => openModal());
document.getElementById('cancelTaskBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

function openModal(task) {
    document.getElementById('taskErrorBox').classList.remove('show');
    document.getElementById('modalTitle').textContent = task ? 'Edit Task' : 'Add Task';
    document.getElementById('taskId').value = task ? task.taskId : '';
    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskDescription').value = task ? (task.description || '') : '';
    document.getElementById('taskCategory').value = task ? (task.category || '') : '';
    document.getElementById('taskPriority').value = task ? task.priority : 'Medium';
    document.getElementById('taskDueDate').value = task ? (task.dueDate || '') : '';
    document.getElementById('taskDueTime').value = task ? (task.dueTime ? task.dueTime.slice(0,5) : '') : '';
    document.getElementById('taskReminder').value = task ? task.reminderMinutes : 15;
    overlay.classList.add('show');
}
function closeModal() {
    overlay.classList.remove('show');
    form.reset();
}

function editTask(taskId) {
    const task = allTasks.find(t => t.taskId === taskId);
    if (task) openModal(task);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('taskErrorBox');
    errorBox.classList.remove('show');

    const taskId = document.getElementById('taskId').value;
    const payload = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim() || null,
        category: document.getElementById('taskCategory').value.trim() || null,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value || null,
        dueTime: document.getElementById('taskDueTime').value ? document.getElementById('taskDueTime').value + ':00' : null,
        reminderMinutes: parseInt(document.getElementById('taskReminder').value || '15', 10)
    };

    const saveBtn = document.getElementById('saveTaskBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        if (taskId) {
            await apiRequest(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await apiRequest(`/tasks/user/${user.userId}`, { method: 'POST', body: JSON.stringify(payload) });
        }
        closeModal();
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.add('show');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Task';
    }
});

// ---------- Notifications ----------
async function refreshNotifications() {
    try {
        const notifs = await apiRequest(`/notifications/user/${user.userId}/check`);
        renderNotifications(notifs);
    } catch (err) {
        console.error(err);
    }
}

function renderNotifications(notifs) {
    const unread = notifs.filter(n => n.status === 'Unread');
    document.getElementById('notifDot').classList.toggle('show', unread.length > 0);

    const panel = document.getElementById('notifPanel');
    if (notifs.length === 0) {
        panel.innerHTML = `<div class="notif-item">No notifications yet.</div>`;
        return;
    }
    panel.innerHTML = notifs.slice(0, 15).map(n => `
        <div class="notif-item ${n.status === 'Unread' ? 'unread' : ''}" onclick="markNotifRead(${n.notificationId})">
            ${escapeHtml(n.message)}
            <div class="time">${timeAgo(n.notificationTime)}</div>
        </div>
    `).join('');
}

async function markNotifRead(id) {
    try {
        await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
        refreshNotifications();
    } catch (err) { console.error(err); }
}

document.getElementById('notifBtn').addEventListener('click', () => {
    document.getElementById('notifPanel').classList.toggle('show');
});
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifPanel');
    const btn = document.getElementById('notifBtn');
    if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('show');
});

// Poll for due-soon / overdue reminders every 60s
setInterval(refreshNotifications, 60000);

loadDashboard();
