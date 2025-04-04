(function () {
    let tabButtons = document.querySelectorAll('.tab-btn');
    let tabContents = document.querySelectorAll('.tab-content');
    let nextButtons = document.querySelectorAll('.next-btn');
    let prevButtons = document.querySelectorAll('.prev-btn');
    let deployButton = document.getElementById('deploy-server');
    
    let sliders = {
        cpu: document.getElementById('cpu-slider'),
        ram: document.getElementById('ram-slider'),
        storage: document.getElementById('storage-slider')
    };
    
    let inputs = {
        cpu: document.getElementById('cpu-input'),
        ram: document.getElementById('ram-input'),
        storage: document.getElementById('storage-input')
    };
    
    let summaryElements = {
        name: document.getElementById('summary-name'),
        location: document.getElementById('summary-location'),
        node: document.getElementById('summary-node'),
        cpu: document.getElementById('summary-cpu'),
        ram: document.getElementById('summary-ram'),
        storage: document.getElementById('summary-storage'),
        cost: document.getElementById('summary-cost')
    };
    
    let formData = {
        name: '',
        description: '',
        location: '',
        node: '',
        cpu: 2,
        ram: 4,
        storage: 50,
        allocations: 2,
        backups: 1,
        databases: 0
    };
    
    let tabs = ['appearance', 'location', 'node', 'resources', 'finalize'];
    let currentTabIndex = 0;
    
    function switchTab(tabId) {
        let activeContent = document.getElementById(`content-${tabId}`);
        
        tabButtons.forEach(btn => {
            btn.classList.remove('bg-zinc-900', 'text-zinc-100');
            btn.classList.add('text-zinc-400', 'hover:bg-zinc-800/70', 'hover:text-zinc-200');
        });
        
        tabContents.forEach(content => {
            content.style.display = "none";
        });
        
        let activeButton = document.getElementById(`tab-${tabId}`);
        if (activeButton) {
            activeButton.classList.remove('text-zinc-400', 'hover:bg-zinc-800/70', 'hover:text-zinc-200');
            activeButton.classList.add('bg-zinc-900', 'text-zinc-100');
        }
        
        if (activeContent) {
            activeContent.style.display = "block";
        }
        
        currentTabIndex = tabs.indexOf(tabId);
        updateSummary();
    }
    
    function updateSummary() {
        let serverName = document.getElementById('server-name');
        if (serverName) {
            formData.name = serverName.value;
            summaryElements.name.textContent = formData.name || '-';
        }
        
        let serverDescription = document.getElementById('server-description');
        if (serverDescription) {
            formData.description = serverDescription.value;
        }
        
        summaryElements.cpu.textContent = `${formData.cpu} Cores`;
        summaryElements.ram.textContent = `${formData.ram} GB`;
        summaryElements.storage.textContent = `${formData.storage} GB`;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            let tabId = button.id.replace('tab-', '');
            switchTab(tabId);
        });
    });
    
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentTabIndex < tabs.length - 1) {
                let nextTab = tabs[currentTabIndex + 1];
                switchTab(nextTab);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentTabIndex > 0) {
                let prevTab = tabs[currentTabIndex - 1];
                switchTab(prevTab);
            }
        });
    });
    
    if (sliders.cpu) {
        sliders.cpu.addEventListener('input', () => {
            let value = sliders.cpu.value;
            document.getElementById('cpu-value').textContent = `${value} Cores`;
            inputs.cpu.value = value;
            formData.cpu = parseInt(value);
            updateSummary();
        });
    }
    
    if (inputs.cpu) {
        inputs.cpu.addEventListener('input', () => {
            let value = parseInt(inputs.cpu.value);
            if (isNaN(value)) value = 1;
            if (value < 1) value = 1;
            if (value > 8) value = 8;
            
            sliders.cpu.value = value;
            document.getElementById('cpu-value').textContent = `${value} Cores`;
            formData.cpu = value;
            updateSummary();
        });
    }
    
    if (sliders.ram) {
        sliders.ram.addEventListener('input', () => {
            let value = sliders.ram.value;
            document.getElementById('ram-value').textContent = `${value} GB`;
            inputs.ram.value = value;
            formData.ram = parseInt(value);
            updateSummary();
        });
    }
    
    if (inputs.ram) {
        inputs.ram.addEventListener('input', () => {
            let value = parseInt(inputs.ram.value);
            if (isNaN(value)) value = 1;
            if (value < 1) value = 1;
            if (value > 16) value = 16;
            
            sliders.ram.value = value;
            document.getElementById('ram-value').textContent = `${value} GB`;
            formData.ram = value;
            updateSummary();
        });
    }
    
    if (sliders.storage) {
        sliders.storage.addEventListener('input', () => {
            let value = sliders.storage.value;
            document.getElementById('storage-value').textContent = `${value} GB`;
            inputs.storage.value = value;
            formData.storage = parseInt(value);
            updateSummary();
        });
    }
    
    if (inputs.storage) {
        inputs.storage.addEventListener('input', () => {
            let value = parseInt(inputs.storage.value);
            if (isNaN(value)) value = 25;
            if (value < 25) value = 25;
            if (value > 500) value = 500;
            
            value = Math.round(value / 25) * 25;
            
            sliders.storage.value = value;
            document.getElementById('storage-value').textContent = `${value} GB`;
            formData.storage = value;
            updateSummary();
        });
    }
    
    function setupSelectionCards() {
        let locationCards = document.querySelectorAll('#content-location div[class*="cursor-pointer"]');
        
        locationCards.forEach(card => {
            card.addEventListener('click', () => {
                locationCards.forEach(c => {
                    c.classList.remove('border-emerald-500', 'bg-emerald-500/10');
                    c.classList.add('border-zinc-800', 'bg-zinc-900/50');
                });

                card.classList.remove('border-zinc-800', 'bg-zinc-900/50');
                card.classList.add('border-emerald-500', 'bg-emerald-500/10');
                
                let locationText = card.querySelector('.text-zinc-200.font-medium')?.textContent || '';
                formData.location = locationText;
                summaryElements.location.textContent = locationText || '-';
            });
        });
        
        let nodeCards = document.querySelectorAll('#content-node div[class*="cursor-pointer"]');
        
        nodeCards.forEach(card => {
            card.addEventListener('click', () => {
                nodeCards.forEach(c => {
                    c.classList.remove('border-emerald-500', 'bg-emerald-500/10');
                    c.classList.add('border-zinc-800', 'bg-zinc-900/50');
                });
                
                card.classList.remove('border-zinc-800', 'bg-zinc-900/50');
                card.classList.add('border-emerald-500', 'bg-emerald-500/10');
                
                let nodeText = card.querySelector('.text-zinc-200.font-medium')?.textContent || '';
                formData.node = nodeText;
                summaryElements.node.textContent = nodeText || '-';
            });
        });
    }
    
    let serverNameInput = document.getElementById('server-name');
    if (serverNameInput) {
        serverNameInput.addEventListener('input', () => {
            formData.name = serverNameInput.value;
            updateSummary();
        });
    }
    
    document.getElementById('next-location')?.addEventListener('click', () => switchTab('location'));
    document.getElementById('next-node')?.addEventListener('click', () => switchTab('node'));
    document.getElementById('next-resources')?.addEventListener('click', () => switchTab('resources'));
    document.getElementById('next-finalize')?.addEventListener('click', () => switchTab('finalize'));
    document.getElementById('prev-appearance')?.addEventListener('click', () => switchTab('appearance'));
    document.getElementById('prev-location')?.addEventListener('click', () => switchTab('location'));
    document.getElementById('prev-node')?.addEventListener('click', () => switchTab('node'));
    document.getElementById('prev-resources')?.addEventListener('click', () => switchTab('resources'));
    
    if (deployButton) {
        deployButton.addEventListener('click', () => {
            if (!formData.name) {
                alert('Please enter a server name.');
                switchTab('appearance');
                return;
            }
            
            if (!formData.location) {
                alert('Please select a server location.');
                switchTab('location');
                return;
            }
            
            if (!formData.node) {
                alert('Please select a node.');
                switchTab('node');
                return;
            }
            
            alert('Server deployment initiated! Your server will be ready shortly.');
        });
    }
    
    document.getElementById('allocations')?.addEventListener('change', (e) => {
        formData.allocations = e.target.value;
        updateSummary();
    });
    
    document.getElementById('backups')?.addEventListener('change', (e) => {
        formData.backups = e.target.value;
        updateSummary();
    });
    
    document.getElementById('databases')?.addEventListener('change', (e) => {
        formData.databases = e.target.value;
        updateSummary();
    });
    
    setupSelectionCards();
    switchTab('appearance');
    
    setTimeout(() => {
        setupSelectionCards();
        switchTab(tabs[currentTabIndex]);
    }, 500);
})();