(function () {
    const rolesTable = document.getElementById('roles-table');
    const usersTable = document.getElementById('users-table');
    const createRoleForm = document.getElementById('create-role-form');
    const editRoleForm = document.getElementById('edit-role-form');
    const editUserRolesForm = document.getElementById('edit-user-roles-form');
    const editUserIntentsForm = document.getElementById('edit-user-intents-form');
    const userSearch = document.getElementById('user-search');

    window.roles = [];
    window.users = [];
    let currentRoleId = null;
    let currentUserId = null;

    async function initialize() {
        await Promise.all([
            loadRoles(),
            loadUsers()
        ]);
        populateIntentSelects();
    }

    window.loadRoles = async function() {
        const response = await fetch('/api/admin/roles');
        const data = await response.json();
        if (data.success) {
            window.roles = data.data;
            renderRoles();
            populateRoleSelects();
        }
    }

    function renderRoles() {
        rolesTable.innerHTML = window.roles.map(role => `
        <tr class="border-t border-zinc-800">
            <td class="p-2">${role.name}</td>
            <td class="p-2">${role.level}</td>
            <td class="p-2">
                <div class="flex flex-wrap gap-1">
                    ${role.intents.slice(0, 3).map(intent =>
            `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">${intent}</span>`
        ).join('')}
                    ${role.intents.length > 3 ?
                `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">+${role.intents.length - 3} more</span>`
                : ''}
                </div>
            </td>
            <td class="p-2">
                <div class="flex space-x-2">
                    <button onclick="editRole('${role.id}')" class="px-2 py-1 text-sm rounded bg-zinc-800 hover:bg-zinc-700">
                        Edit
                    </button>
                    <button onclick="deleteRole('${role.id}')" class="px-2 py-1 text-sm rounded bg-red-900/50 hover:bg-red-900/70">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    }

    function populateIntentSelects() {
        const intentSelects = document.querySelectorAll('select[name="intents"]');
        if (!intentSelects.length) return;

        const allIntents = new Set();

        const commonIntents = [
            "hc.pages.landing.*",
            "hc.pages.auth.*",
            "hc.pages.home",
            "hc.pages.dashboard",
            "hc.pages.servers.*",
            "hc.pages.economy.*",
            "hc.pages.account.*",
            "hc.pages.notifications.*",
            "hc.pages.requests.*",
            "hc.pages.market.*",
            "hc.pages.chat.*",
            "hc.roles.guest",
            "hc.roles.user",
            "hc.roles.mod",
            "hc.roles.admin",
            "hc.pages.admin.*",
            "hc.*"
        ];

        commonIntents.forEach(intent => allIntents.add(intent));
        window.roles.forEach(role => role.intents.forEach(intent => allIntents.add(intent)));
        window.users.forEach(user => (user.intents || []).forEach(intent => allIntents.add(intent)));

        const sortedIntents = Array.from(allIntents).sort();

        intentSelects.forEach(select => {
            select.innerHTML = sortedIntents.map(intent =>
                `<option value="${intent}">${intent}</option>`
            ).join('');
        });
    }

    function populateRoleSelects() {
        const roleSelects = document.querySelectorAll('select[name="roles"]');
        if (!roleSelects.length) return;

        roleSelects.forEach(select => {
            select.innerHTML = window.roles.map(role =>
                `<option value="${role.name}">${role.name}</option>`
            ).join('');
        });
    }

    window.showModal = function(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    window.hideModal = function(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    window.loadUsers = async function() {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        if (data.success) {
            window.users = data.data;
            renderUsers();
        }
    }

    function renderUsers() {
        const filteredUsers = userSearch.value ?
            window.users.filter(user =>
                user.email && user.email.toLowerCase().includes(userSearch.value.toLowerCase())
            ) : window.users;

        usersTable.innerHTML = filteredUsers.map(user => `
        <tr class="border-t border-zinc-800">
            <td class="p-2">${user.email || 'Unknown'}</td>
            <td class="p-2">
                <div class="flex flex-wrap gap-1">
                    ${(user.roles || []).map(role =>
            `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">${role}</span>`
        ).join('')}
                </div>
            </td>
            <td class="p-2">
                <div class="flex flex-wrap gap-1">
                    ${(user.intents || []).slice(0, 3).map(intent =>
            `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">${intent}</span>`
        ).join('')}
                    ${(user.intents || []).length > 3 ?
                `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">+${user.intents.length - 3} more</span>`
                : ''}
                </div>
            </td>
            <td class="p-2">
                <div class="flex space-x-2">
                    <button onclick="editUserRoles('${user.id}')" class="px-2 py-1 text-sm rounded bg-zinc-800 hover:bg-zinc-700">
                        Edit Roles
                    </button>
                    <button onclick="editUserIntents('${user.id}')" class="px-2 py-1 text-sm rounded bg-zinc-800 hover:bg-zinc-700">
                        Edit Intents
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    }

    createRoleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createRoleForm);
        const roleData = {
            name: formData.get('name'),
            level: parseInt(formData.get('level')),
            intents: Array.from(formData.getAll('intents'))
        };

        if (!roleData.name || roleData.level === undefined || !roleData.intents.length) {
            alert('Please fill out all fields');
            return;
        }

        const response = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });

        const data = await response.json();
        if (data.success) {
            await window.loadRoles();
            window.hideModal('create-role-modal');
            createRoleForm.reset();
        } else {
            alert('Failed to create role: ' + (data.message || 'Unknown error'));
        }
    });

    editRoleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editRoleForm);
        const roleData = {
            name: formData.get('name'),
            level: parseInt(formData.get('level')),
            intents: Array.from(formData.getAll('intents'))
        };

        if (!roleData.name || roleData.level === undefined || !roleData.intents.length) {
            alert('Please fill out all fields');
            return;
        }

        const roleId = formData.get('id');
        const response = await fetch(`/api/admin/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });

        const data = await response.json();
        if (data.success) {
            await window.loadRoles();
            window.hideModal('edit-role-modal');
        } else {
            alert('Failed to update role: ' + (data.message || 'Unknown error'));
        }
    });

    editUserRolesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editUserRolesForm);
        const userId = formData.get('userId');
        const selectedRoles = Array.from(formData.getAll('roles'));

        const user = window.users.find(u => u.id === userId);
        if (!user) return;

        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roles: selectedRoles,
                intents: user.intents || []
            })
        });

        const data = await response.json();
        if (data.success) {
            await window.loadUsers();
            window.hideModal('edit-user-roles-modal');
        } else {
            alert('Failed to update user roles: ' + (data.message || 'Unknown error'));
        }
    });

    editUserIntentsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editUserIntentsForm);
        const userId = formData.get('userId');
        const selectedIntents = Array.from(formData.getAll('intents'));

        const user = window.users.find(u => u.id === userId);
        if (!user) return;

        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roles: user.roles || [],
                intents: selectedIntents
            })
        });

        const data = await response.json();
        if (data.success) {
            await window.loadUsers();
            window.hideModal('edit-user-intents-modal');
        } else {
            alert('Failed to update user intents: ' + (data.message || 'Unknown error'));
        }
    });

    userSearch.addEventListener('input', renderUsers);

    initialize();
})();

window.editRole = function(id) {
    const role = window.roles.find(r => r.id === id);
    if (!role) return;

    const editRoleForm = document.getElementById('edit-role-form');
    editRoleForm.elements.id.value = id;
    editRoleForm.elements.name.value = role.name;
    editRoleForm.elements.level.value = role.level;

    const intentSelect = editRoleForm.elements.intents;
    for (let i = 0; i < intentSelect.options.length; i++) {
        intentSelect.options[i].selected = role.intents.includes(intentSelect.options[i].value);
    }

    window.showModal('edit-role-modal');
};

window.deleteRole = async function(id) {
    if (!confirm('Are you sure you want to delete this role?')) return;

    const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
        await window.loadRoles();
    } else {
        alert('Failed to delete role: ' + (data.message || 'Unknown error'));
    }
};

window.editUserRoles = function(userId) {
    const user = window.users.find(u => u.id === userId);
    if (!user) return;

    const editUserRolesForm = document.getElementById('edit-user-roles-form');
    editUserRolesForm.elements.userId.value = userId;
    document.getElementById('user-email').textContent = user.email || 'Unknown';

    const roleSelect = editUserRolesForm.elements.roles;
    for (let i = 0; i < roleSelect.options.length; i++) {
        roleSelect.options[i].selected = (user.roles || []).includes(roleSelect.options[i].value);
    }

    window.showModal('edit-user-roles-modal');
};

window.editUserIntents = function(userId) {
    const user = window.users.find(u => u.id === userId);
    if (!user) return;

    const editUserIntentsForm = document.getElementById('edit-user-intents-form');
    editUserIntentsForm.elements.userId.value = userId;
    document.getElementById('user-email-intents').textContent = user.email || 'Unknown';

    const intentSelect = editUserIntentsForm.elements.intents;
    for (let i = 0; i < intentSelect.options.length; i++) {
        intentSelect.options[i].selected = (user.intents || []).includes(intentSelect.options[i].value);
    }

    window.showModal('edit-user-intents-modal');
};
