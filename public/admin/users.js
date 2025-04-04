(function () {
    let currentPage = 1;
    const usersPerPage = 10;
    let totalUsers = 0;
    
    console.log('Admin users page loaded, initializing...');
    
        fetch('/api/admin/users?page=1&limit=10')
        .then(response => {
            console.log('Initial API test response status:', response.status);
            if (!response.ok) throw new Error(`API status ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Initial API test data:', data);
        })
        .catch(error => {
            console.error('Initial API test error:', error);
        })
        .finally(() => {
            loadUsers();
        });
    
    document.getElementById('create-user-form').addEventListener('submit', createUser);
    document.getElementById('edit-user-form').addEventListener('submit', updateUser);
    
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadUsers();
    });
    
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });
    
    document.getElementById('user-filter').addEventListener('input', debounce(() => {
        currentPage = 1;
        loadUsers();
    }, 300));
    
    function loadUsers() {
        const filter = document.getElementById('user-filter').value;
        const usersTable = document.getElementById('users-table');
        
        usersTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading...</td></tr>';
        
        console.log(`Fetching users: page=${currentPage}, limit=${usersPerPage}, filter=${filter}`);
        
                setTimeout(() => {
            fetch(`/api/admin/users?page=${currentPage}&limit=${usersPerPage}&filter=${encodeURIComponent(filter)}`)
                .then(response => {
                    console.log('API response status:', response.status);
                    if (!response.ok) throw new Error(`API error: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('Users data received:', data);
                    totalUsers = data.total || 0;
                    document.getElementById('total-users').textContent = totalUsers;
                    
                    document.getElementById('page-info').textContent = `Page ${currentPage}`;
                    document.getElementById('prev-page').disabled = currentPage <= 1;
                    document.getElementById('next-page').disabled = currentPage * usersPerPage >= totalUsers;
                    
                    usersTable.innerHTML = '';
                    
                    if (data.users && data.users.length > 0) {
                        data.users.forEach(user => {
                            renderUserRow(user, usersTable);
                        });
                    } else {
                        usersTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">No users found</td></tr>';
                    }
                })
                .catch(error => {
                    console.error('Error loading users:', error);
                    usersTable.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-400">Error loading users: ${error.message}</td></tr>`;
                });
        }, 100);
    }
    
    function renderUserRow(user, usersTable) {
        const row = document.createElement('tr');
        row.className = 'border-t border-zinc-800';
        
        let createdDate;
        try {
            createdDate = new Date(user.createdAt);
        } catch (e) {
            createdDate = new Date();
        }
        const formattedDate = createdDate.toLocaleDateString();
        
        let statusBadge = '';
        switch (user.status) {
            case 'active':
                statusBadge = '<span class="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Active</span>';
                break;
            case 'suspended':
                statusBadge = '<span class="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">Suspended</span>';
                break;
            case 'banned':
                statusBadge = '<span class="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">Banned</span>';
                break;
            default:
                statusBadge = '<span class="px-2 py-1 rounded-full bg-zinc-500/20 text-zinc-400 text-xs">Unknown</span>';
        }
        
        row.innerHTML = `
            <td class="p-2">${user.id || 'N/A'}</td>
            <td class="p-2">${user.name || 'Unknown'}</td>
            <td class="p-2">${user.email || 'No email'}</td>
            <td class="p-2">${formattedDate}</td>
            <td class="p-2">${statusBadge}</td>
            <td class="p-2">
                <div class="flex space-x-1">
                    <button onclick="editUser('${user.id}')" class="p-1 text-blue-400 hover:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button onclick="resetPassword('${user.id}')" class="p-1 text-yellow-400 hover:text-yellow-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                    </button>
                    <button onclick="confirmDeleteUser('${user.id}')" class="p-1 text-red-400 hover:text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        usersTable.appendChild(row);
    }
    
    function createUser(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideModal('create-user-modal');
                form.reset();
                loadUsers();
                showNotification('User created successfully', 'success');
            } else {
                showNotification(data.message || 'Failed to create user', 'error');
            }
        })
        .catch(error => {
            console.error('Error creating user:', error);
            showNotification('An error occurred', 'error');
        });
    }
    
    function updateUser(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const userId = formData.get('userId');
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            status: formData.get('status')
        };
        
        fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideModal('edit-user-modal');
                loadUsers();
                showNotification('User updated successfully', 'success');
            } else {
                showNotification(data.message || 'Failed to update user', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating user:', error);
            showNotification('An error occurred', 'error');
        });
    }

    document.addEventListener('reload-users', function() {
        loadUsers();
    });
})();

function editUser(userId) {
    fetch(`/api/admin/users/${userId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user');
            return response.json();
        })
        .then(data => {
            if (data.user) {
                const form = document.getElementById('edit-user-form');
                form.querySelector('[name="userId"]').value = data.user.id;
                form.querySelector('[name="name"]').value = data.user.name;
                form.querySelector('[name="email"]').value = data.user.email;
                form.querySelector('[name="status"]').value = data.user.status || 'active';
                showModal('edit-user-modal');
            } else {
                showNotification('User not found', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            showNotification('An error occurred', 'error');
        });
}

function resetPassword(userId) {
    if (confirm('Send password reset email to this user?')) {
        fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Password reset email sent', 'success');
                } else {
                    showNotification(data.message || 'Failed to send reset email', 'error');
                }
            })
            .catch(error => {
                console.error('Error resetting password:', error);
                showNotification('An error occurred', 'error');
            });
    }
}

function confirmDeleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.dispatchEvent(new Event('reload-users'));
                    showNotification('User deleted successfully', 'success');
                } else {
                    showNotification(data.message || 'Failed to delete user', 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showNotification('An error occurred', 'error');
            });
    }
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `p-3 rounded-lg shadow-lg flex items-center justify-between max-w-sm transition-all transform translate-x-0`;
    
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-600', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-600', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-600', 'text-white');
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
        </div>
        <button class="ml-3 text-white hover:text-zinc-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
            notification.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 5000);
    
    notification.querySelector('button').addEventListener('click', () => {
        notification.classList.add('opacity-0');
        setTimeout(() => notification.remove(), 300);
    });
}

function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}