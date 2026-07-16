/* =========================================================
   Todo Manager — shared JS helpers
   Handles API base, session (localStorage), and theme.
   ========================================================= */

const API_BASE = '/api';

// ---------- Session ----------
function getCurrentUser() {
    const raw = localStorage.getItem('todo_user');
    return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) {
    localStorage.setItem('todo_user', JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem('todo_user');
}
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}
function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// ---------- Theme ----------
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'Dark' ? 'dark' : 'light');
}
function initThemeFromUser() {
    const user = getCurrentUser();
    applyTheme(user && user.theme ? user.theme : 'Light');
}

// Applies a theme instantly, saves it to localStorage + the server,
// and returns the updated user. Shared by the header toggle button
// and the Profile page switch so both stay in sync.
async function setThemeAndPersist(theme) {
    const u = getCurrentUser();
    if (!u) return null;
    applyTheme(theme);
    u.theme = theme;
    setCurrentUser(u);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    try {
        const updated = await apiRequest(`/users/${u.userId}/theme`, {
            method: 'PUT',
            body: JSON.stringify({ theme })
        });
        setCurrentUser(updated);
        return updated;
    } catch (err) {
        console.error('Could not save theme preference:', err);
        return u;
    }
}

// Wires an icon button (e.g. #themeToggleBtn) to flip the theme instantly.
// Listens for 'themechange' so it stays correct even if another control
// (like the Profile page switch) changes the theme on the same page.
function setupThemeToggleButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const syncIcon = () => {
        const u = getCurrentUser();
        btn.textContent = (u && u.theme === 'Dark') ? '☀️' : '🌙';
    };
    syncIcon();
    document.addEventListener('themechange', syncIcon);

    btn.addEventListener('click', async () => {
        const u = getCurrentUser();
        if (!u) return;
        const newTheme = u.theme === 'Dark' ? 'Light' : 'Dark';
        await setThemeAndPersist(newTheme);
        syncIcon();
    });
}

// ---------- Fetch wrapper ----------
async function apiRequest(path, options = {}) {
    const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) {
        const message = (data && data.error) ? data.error : 'Something went wrong. Please try again.';
        throw new Error(message);
    }
    return data;
}

async function apiUpload(path, formData) {
    const res = await fetch(API_BASE + path, { method: 'POST', body: formData });
    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (!res.ok) throw new Error((data && data.error) || 'Upload failed.');
    return data;
}

// ---------- Small utils ----------
function formatDate(dateStr) {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function timeAgo(dateTimeStr) {
    if (!dateTimeStr) return '';
    const diffMs = Date.now() - new Date(dateTimeStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Reward toast ----------
function showRewardToast(pointsEarned, milestone) {
    if (!pointsEarned) return;
    let toast = document.getElementById('rewardToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'rewardToast';
        toast.className = 'reward-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = milestone
        ? `🏅 <span>+${pointsEarned} points — new sticker unlocked!</span>`
        : `⭐ <span>+${pointsEarned} points earned! Great job.</span>`;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
