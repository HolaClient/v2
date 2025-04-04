(function () {
    const settingsForm = document.getElementById('settings-form');
    const settingsInputs = document.querySelectorAll('.settings-input');
    const settingsPopup = document.getElementById('settings-popup');
    const saveButton = document.getElementById('settings-save');
    const revertButton = document.getElementById('settings-revert');
    
    let hasChanges = false;
    let originalValues = {};
    
    settingsInputs.forEach((input) => {
        originalValues[input.name] = input.tagName === 'SELECT' ? input.value : input.value;
        
        input.addEventListener('change', () => {
            hasChanges = true;
            showPopup();
        });
        
        input.addEventListener('input', () => {
            hasChanges = true;
            showPopup();
        });
    });
    
    function showPopup() {
        if (hasChanges) {
            settingsPopup.classList.remove('hidden');
            settingsPopup.style.display = 'block';
        }
    }
    
    function hidePopup() {
        settingsPopup.classList.add('hidden');
        settingsPopup.style.display = 'none';
    }
    
    saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        const formData = new FormData(settingsForm);
        const settings = {};
        
        formData.forEach((value, key) => {
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            
            settings[key] = value;
        });
        
        fetch('/api/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settings }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                settingsInputs.forEach(input => {
                    originalValues[input.name] = input.tagName === 'SELECT' ? input.value : input.value;
                });
                
                showNotification(data.message || 'Settings saved successfully', 'success');
                hasChanges = false;
                hidePopup();
            } else {
                showNotification(data.message || 'Error saving settings', 'error');
            }
        })
        .catch(error => {
            showNotification('Network error, please try again', 'error');
        });
    });
    
    revertButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        settingsInputs.forEach(input => {
            const originalValue = originalValues[input.name];
            
            if (input.tagName === 'SELECT') {
                input.value = originalValue;
            } else {
                input.value = originalValue;
            }
        });
        
        hasChanges = false;
        hidePopup();
        showNotification('Changes reverted', 'info');
    });
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all z-50 ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
        } text-white`;
        notification.textContent = message;
        notification.style.opacity = '1';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
})();