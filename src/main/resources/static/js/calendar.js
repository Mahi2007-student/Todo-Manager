/* =========================================================
   Calendar logic: month grid rendering, per-day task list,
   add task pre-filled with the selected date, toggle/delete.
   ========================================================= */

const user = requireAuth();
if (user) {
    initThemeFromUser();
    setupThemeToggleButton('themeToggleBtn');
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('categoriesLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Categories are managed inline on each task (see the Category field when adding a task).');
});

let viewDate = new Date();          // month currently displayed
let selectedDate = new Date();      // day currently selected
let tasksByDate = {};               // "YYYY-MM-DD" -> [tasks]

function toISODate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function loadMonthTasks() {
    try {
        const all = await apiRequest(`/tasks/user/${user.userId}`);
        tasksByDate = {};
        all.forEach(t => {
            if (!t.dueDate) return;
            (tasksByDate[t.dueDate] = tasksByDate[t.dueDate] || []).push(t);
        });
        renderCalendar();
        renderDayTasks();
    } catch (err) {
        console.error(err);
    }
}

function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    document.getElementById('monthLabel').textContent =
        viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const grid = document.getElementById('calendarGrid');
    const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = dows.map(d => `<div class="dow">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISODate(new Date());
    const selectedISO = toISODate(selectedDate);

    for (let i = 0; i < startOffset; i++) html += `<div class="day-cell empty"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const iso = toISODate(cellDate);
        const dayTasks = tasksByDate[iso] || [];
        const dots = dayTasks.slice(0, 4).map(t => `<span class="dot ${t.status === 'Completed' ? 'done' : ''}"></span>`).join('');

        html += `<div class="day-cell ${iso === todayISO ? 'today' : ''} ${iso === selectedISO ? 'selected' : ''}" data-date="${iso}">
                    <span class="day-num">${day}</span>
                    <div class="dot-row">${dots}</div>
                 </div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.day-cell:not(.empty)').forEach(cell => {
        cell.addEventListener('click', () => {
            selectedDate = new Date(cell.dataset.date + 'T00:00:00');
            renderCalendar();
            renderDayTasks();
        });
    });
}

function renderDayTasks() {
    const iso = toISODate(selectedDate);
    document.getElementById('selectedDateLabel').textContent =
        selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    const tasks = tasksByDate[iso] || [];
    const list = document.getElementById('dayTaskList');
    if (tasks.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="emoji">📭</div>Nothing due this day.</div>`;
        return;
    }
    list.innerHTML = tasks.map(t => `
        <div class="task-card priority-${t.priority} ${t.status === 'Completed' ? 'completed' : ''}">
            <button class="task-check" onclick="toggleTask(${t.taskId})">
                ${t.status === 'Completed' ? '↺ Mark Pending' : '✓ Mark Complete'}
            </button>
            <div class="task-body">
                <p class="task-title">${escapeHtml(t.title)}</p>
                <div class="task-meta">
                    <span class="badge ${t.priority}">${t.priority}</span>
                    ${t.dueTime ? `<span>🕒 ${t.dueTime.slice(0,5)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="delete" onclick="deleteTask(${t.taskId})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function toggleTask(taskId) {
    try {
        const result = await apiRequest(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
        if (result.pointsEarned > 0) {
            showRewardToast(result.pointsEarned, result.milestone);
        }
        await loadMonthTasks();
    } catch (err) { alert(err.message); }
}
async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
        await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
        await loadMonthTasks();
    } catch (err) { alert('Could not delete task: ' + err.message); }
}

document.getElementById('prevMonth').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
});

// ---------- Add task modal (pre-fills selected date) ----------
const overlay = document.getElementById('taskModalOverlay');
const form = document.getElementById('taskForm');

document.getElementById('addTaskBtn').addEventListener('click', () => {
    document.getElementById('taskErrorBox').classList.remove('show');
    document.getElementById('modalTitle').textContent = 'Add Task';
    form.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskDueDate').value = toISODate(selectedDate);
    overlay.classList.add('show');
});
document.getElementById('cancelTaskBtn').addEventListener('click', () => overlay.classList.remove('show'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('taskErrorBox');
    errorBox.classList.remove('show');
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
    try {
        await apiRequest(`/tasks/user/${user.userId}`, { method: 'POST', body: JSON.stringify(payload) });
        overlay.classList.remove('show');
        form.reset();
        await loadMonthTasks();
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.add('show');
    } finally {
        saveBtn.disabled = false;
    }
});

loadMonthTasks();
