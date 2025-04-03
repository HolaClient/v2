document.addEventListener('DOMContentLoaded', () => {
    const setupTabs = () => {
        const tabButtons = document.querySelectorAll('.account-tab-btn');
        const tabContents = document.querySelectorAll('.account-tab-content');
        
        const switchTab = (tabId) => {
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            tabButtons.forEach(btn => {
                btn.classList.remove('text-zinc-300');
                btn.classList.remove('bg-zinc-900');
                btn.querySelector('.tab-indicator')?.classList.add('opacity-0');
            });
            
            const selectedTab = document.getElementById(`content-${tabId}`);
            const selectedButton = document.getElementById(`tab-${tabId}`);
            
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
            }
            
            if (selectedButton) {
                selectedButton.classList.add('text-zinc-300');
                selectedButton.classList.add('bg-zinc-900');
                selectedButton.querySelector('.tab-indicator')?.classList.remove('opacity-0');
            }
            
            history.pushState({}, '', `?tab=${tabId}`);
        };
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        if (tabParam && document.getElementById(`content-${tabParam}`)) {
            switchTab(tabParam);
        } else {
            switchTab('profile');
        }
    };
    
    const setupForms = () => {
        const profileForm = document.getElementById('profile-form');
        const editForm = document.getElementById('edit-form');
        const settingsForm = document.getElementById('settings-form');
        
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarPreview = document.getElementById('avatar-preview');
        
        if (avatarUpload && avatarPreview) {
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        avatarPreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const submitBtn = profileForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                `;
                
                setTimeout(() => {
                    showNotification('Profile updated successfully!', 'success');
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 1500);
            });
        }
        
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const submitBtn = editForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                `;
                
                setTimeout(() => {
                    showNotification('Account details updated successfully!', 'success');
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 1500);
            });
        }
        
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const submitBtn = settingsForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                `;
                
                setTimeout(() => {
                    showNotification('Settings updated successfully!', 'success');
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 1500);
            });
        }
    };
    
    const showNotification = (message, type = 'info') => {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end space-y-2';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `transform transition-all duration-300 translate-x-full opacity-0 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/80 p-4 rounded-lg shadow-lg max-w-md flex items-center space-x-3`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        } else if (type === 'error') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        } else {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                ${icon}
                <p class="text-zinc-100">${message}</p>
            </div>
            <button class="text-zinc-400 hover:text-zinc-200 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        
        document.getElementById('notification-container').appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 4000);
    };
    
    setupTabs();
    setupForms();
});