/* =========================================================
   Profile logic: load/edit personal details, photo upload,
   theme toggle (persists to DB + applies instantly), password change.
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

function showMessage(box, msg) {
    box.textContent = msg;
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 4000);
}

function populateForm(u) {
    document.getElementById('fullName').value = u.fullName || '';
    document.getElementById('username').value = u.username || '';
    document.getElementById('email').value = u.email || '';
    document.getElementById('phone').value = u.phone || '';
    document.getElementById('dob').value = u.dob || '';
    document.getElementById('country').value = u.country || '';
    document.getElementById('gender').value = u.gender || '';
    document.getElementById('themeSwitch').checked = u.theme === 'Dark';
    document.getElementById('profileImg').src = u.profilePicture && u.profilePicture.startsWith('/uploads')
        ? u.profilePicture
        : 'img/default-profile.png';
}

async function loadProfile() {
    try {
        const fresh = await apiRequest(`/users/${user.userId}`);
        setCurrentUser(fresh);
        populateForm(fresh);
    } catch (err) {
        console.error(err);
        populateForm(user);
    }
}

// ---------- Save personal details ----------
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('errorBox');
    const successBox = document.getElementById('successBox');
    errorBox.classList.remove('show');

    const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim() || null,
        dob: document.getElementById('dob').value || null,
        country: document.getElementById('country').value.trim() || null,
        gender: document.getElementById('gender').value || null
    };

    const btn = document.getElementById('saveProfileBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const updated = await apiRequest(`/users/${user.userId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setCurrentUser(updated);
        showMessage(successBox, 'Profile updated successfully.');
    } catch (err) {
        showMessage(errorBox, err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
});

// ---------- Theme toggle ----------
document.getElementById('themeSwitch').addEventListener('change', async (e) => {
    const theme = e.target.checked ? 'Dark' : 'Light';
    await setThemeAndPersist(theme);
});
document.addEventListener('themechange', (e) => {
    document.getElementById('themeSwitch').checked = e.detail.theme === 'Dark';
});

// ---------- Photo upload ----------
document.getElementById('changePhotoBtn').addEventListener('click', () => document.getElementById('photoInput').click());
document.getElementById('photoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const updated = await apiUpload(`/users/${user.userId}/profile-picture`, formData);
        setCurrentUser(updated);
        document.getElementById('profileImg').src = updated.profilePicture;
        showMessage(document.getElementById('successBox'), 'Profile picture updated.');
    } catch (err) {
        showMessage(document.getElementById('errorBox'), err.message);
    }
});

// ---------- Change password ----------
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('errorBox');
    const successBox = document.getElementById('successBox');
    const btn = document.getElementById('savePasswordBtn');
    btn.disabled = true;

    try {
        await apiRequest(`/users/${user.userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: document.getElementById('newPassword').value
            })
        });
        showMessage(successBox, 'Password updated successfully.');
        document.getElementById('passwordForm').reset();
    } catch (err) {
        showMessage(errorBox, err.message);
    } finally {
        btn.disabled = false;
    }
});

loadProfile();
