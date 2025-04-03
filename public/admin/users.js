const rolesTable = document.getElementById('roles-table');
const usersTable = document.getElementById('users-table');
const intentGroups = document.getElementById('intent-groups');
const roleModal = document.getElementById('role-modal');
const roleForm = document.getElementById('role-form');
const userSearch = document.getElementById('user-search');

let roles = [];
let users = [];
let currentRole = null;

async function initialize() {
    await Promise.all([
        loadRoles(),
        loadUsers()
    ]);
    renderIntentGroups();
}

async function loadRoles() {
    const response = await fetch('/api/admin/roles');
    const data = await response.json();
    if (data.success) {
        roles = data.data;
        renderRoles();
    }
}

function renderRoles() {
    rolesTable.innerHTML = roles.map(role => `
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

async function createRole() {
    currentRole = null;
    roleForm.reset();
    roleModal.classList.remove('hidden');
}

async function editRole(id) {
    const role = roles.find(r => r.id === id);
    if (role) {
        currentRole = role;
        roleForm.elements.name.value = role.name;
        roleForm.elements.level.value = role.level;
        Array.from(roleForm.elements.intents.options).forEach(option => {
            option.selected = role.intents.includes(option.value);
        });
        roleModal.classList.remove('hidden');
    }
}

async function deleteRole(id) {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
        await loadRoles();
    }
}

roleForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(roleForm);
    const roleData = {
        name: formData.get('name'),
        level: parseInt(formData.get('level')),
        intents: Array.from(formData.getAll('intents'))
    };

    const response = await fetch(currentRole ? 
        `/api/admin/roles/${currentRole.id}` : 
        '/api/admin/roles', {
        method: currentRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
    });

    const data = await response.json();
    if (data.success) {
        await loadRoles();
        closeModal('role-modal');
    }
};

async function loadUsers() {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    if (data.success) {
        users = data.data;
        renderUsers();
    }
}

function renderUsers() {
    const filteredUsers = userSearch.value ? 
        users.filter(user => 
            user.email.toLowerCase().includes(userSearch.value.toLowerCase())
        ) : users;

    usersTable.innerHTML = filteredUsers.map(user => `
        <tr class="border-t border-zinc-800">
            <td class="p-2">${user.email}</td>
            <td class="p-2">
                <select multiple onchange="updateUserRoles('${user.id}', this)" class="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                    ${roles.map(role => `
                        <option value="${role.name}" ${user.roles.includes(role.name) ? 'selected' : ''}>
                            ${role.name}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td class="p-2">
                <div class="flex flex-wrap gap-1">
                    ${user.intents.slice(0, 3).map(intent => 
                        `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">${intent}</span>`
                    ).join('')}
                    ${user.intents.length > 3 ? 
                        `<span class="px-2 py-0.5 text-xs rounded-full bg-zinc-800">+${user.intents.length - 3} more</span>` 
                        : ''}
                </div>
            </td>
            <td class="p-2">
                <button onclick="editUserIntents('${user.id}')" class="px-2 py-1 text-sm rounded bg-zinc-800 hover:bg-zinc-700">
                    Edit Intents
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateUserRoles(userId, select) {
    const selectedRoles = Array.from(select.selectedOptions).map(option => option.value);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            roles: selectedRoles,
            intents: user.intents
        })
    });

    const data = await response.json();
    if (data.success) {
        await loadUsers();
    }
}

function renderIntentGroups() {
    const allIntents = new Set();
    roles.forEach(role => role.intents.forEach(intent => allIntents.add(intent)));
    users.forEach(user => user.intents.forEach(intent => allIntents.add(intent)));

    const groups = {};
    Array.from(allIntents).forEach(intent => {
        const group = intent.split('.')[0];
        if (!groups[group]) groups[group] = [];
        groups[group].push(intent);
    });

    intentGroups.innerHTML = Object.entries(groups).map(([group, intents]) => `
        <div class="bg-zinc-800/50 rounded-lg p-4">
            <h3 class="text-zinc-300 font-medium mb-2">${group}</h3>
            <div class="space-y-1">
                ${intents.map(intent => `
                    <div class="flex items-center justify-between">
                        <span class="text-zinc-400 text-sm">${intent}</span>
                        <button onclick="deleteIntent('${intent}')" class="text-red-400 hover:text-red-300">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

userSearch.addEventListener('input', renderUsers);

initialize();
