(async function () {
    let res = await fetch('/api/client/deploy');
    let deployData = await res.json();
    deployData = deployData.data || deployData;

    let tabButtons = document.querySelectorAll('.tab-btn');
    let tabContents = document.querySelectorAll('.tab-content');
    let nextButtons = document.querySelectorAll('.next-btn');
    let prevButtons = document.querySelectorAll('.prev-btn');
    let deployButton = document.getElementById('deploy-server');

    let locationsContainer = document.getElementById('locations-container');
    let nodesContainer = document.getElementById('nodes-container');

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
        cpu: (deployData?.resources?.cpu / 100) ?? 1,
        ram: (deployData?.resources?.memory / 1024) ?? 1,
        storage: (deployData?.resources?.storage / 1024) ?? 25,
        allocations: deployData?.resources?.allocations ?? 1,
        backups: deployData?.resources?.backups ?? 0,
        databases: deployData?.resources?.databases ?? 0,
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
            content.classList.add('hidden');
        });

        let activeButton = document.getElementById(`tab-${tabId}`);
        if (activeButton) {
            activeButton.classList.remove('text-zinc-400', 'hover:bg-zinc-800/70', 'hover:text-zinc-200');
            activeButton.classList.add('bg-zinc-900', 'text-zinc-100');
        }

        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        currentTabIndex = tabs.indexOf(tabId);

        updateNavigationButtons();
        updateSummary();
    }

    function updateNavigationButtons() {
        const prevButtons = document.querySelectorAll('.prev-btn');
        prevButtons.forEach(btn => {
            if (currentTabIndex === 0) {
                btn.classList.add('invisible');
            } else {
                btn.classList.remove('invisible');
            }
        });

        const nextButtons = document.querySelectorAll('.next-btn');
        nextButtons.forEach(btn => {
            if (currentTabIndex === tabs.length - 1) {
                btn.classList.add('invisible');
            } else {
                btn.classList.remove('invisible');
            }
        });
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

        summaryElements.location.textContent = formData.location || '-';
        summaryElements.node.textContent = formData.node || '-';
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
        let locationCards = document.querySelectorAll('#locations-container div[class*="cursor-pointer"]');

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
                

                filterNodesByLocation(locationText);
            });
        });


        setupNodeCards();
    }

    function setupNodeCards() {
        let nodeCards = document.querySelectorAll('#nodes-container div[class*="cursor-pointer"]');

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
                formData.nodeId = card.getAttribute('data-node-id');
                summaryElements.node.textContent = nodeText || '-';
            });
        });
    }

    function filterNodesByLocation(locationName) {

        nodesContainer.innerHTML = '';
        

        const selectedLocation = deployData.locations.find(loc => loc.name === locationName);
        
        if (!selectedLocation) {

            nodesContainer.innerHTML = '<div class="col-span-3 text-center text-zinc-400 py-4">Please select a valid location first.</div>';
            return;
        }

        const filteredNodes = deployData.nodes.filter(node => {
            return node.location.id === selectedLocation.id || 
                   String(node.location.id) === String(selectedLocation.id);
        });
        
        
        if (filteredNodes.length === 0) {

            nodesContainer.innerHTML = '<div class="col-span-3 text-center text-zinc-400 py-4">No nodes available in this location.</div>';
            return;
        }
        

        for (let node of filteredNodes) {
            nodesContainer.innerHTML += `
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-zinc-600 transition-all" data-node-id="${node.id}">
                <div class="flex justify-between mb-2">
                    <span class="text-zinc-200 font-medium">${node.displayName || node.name}</span>
                    <span class="text-emerald-400 text-sm">${node.id}</span>
                </div>
                <p class="text-zinc-400 text-sm mb-2">${node.description || 'No description provided'}</p>
                <div class="flex items-center space-x-4 text-sm text-zinc-400 w-full">
                    <span>${node.name}</span>
                    <span>Fee: ${node.fee || '0'}</span>
                </div>
            </div>`;
        }
        

        setupNodeCards();
    }

    function populateLocations() {
        locationsContainer.innerHTML = '';
        for (let i of deployData.locations) {
            locationsContainer.innerHTML += `
            <div class="relative bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:border-zinc-600 transition-all flex items-center space-x-4 h-fit">
                <img src="${i.image}" alt="${i.name}" class="w-auto h-10 rounded-lg">
                <div class="flex flex-col h-fit">
                    <span class="text-zinc-200 font-medium">${i.name}</span>
                    <p class="text-zinc-400 text-sm">${i.country.iso2} - ${i.country.name}</p>
                </div>
            </div>`;
        }
    }

    function initializeNodeContainer() {
        nodesContainer.innerHTML = '<div class="col-span-3 text-center text-zinc-400 py-4">Please select a location first to see available nodes.</div>';
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
        deployButton.addEventListener('click', async () => {

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


            deployButton.disabled = true;
            const originalButtonText = deployButton.innerHTML;
            deployButton.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
            `;

            try {

                const serverData = {
                    name: formData.name,
                    description: formData.description || '',
                    nodeId: formData.nodeId,
                    location: formData.location,
                    resources: {
                        cpu: formData.cpu * 100,
                        memory: formData.ram * 1024,
                        storage: formData.storage * 1024,
                        allocations: parseInt(formData.allocations) || 1,
                        backups: parseInt(formData.backups) || 0,
                        databases: parseInt(formData.databases) || 0
                    }
                };


                const response = await fetch('/api/client/deploy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ server: serverData })
                });

                const result = await response.json();

                if (result.success) {

                    alert('Server deployment successful! Redirecting to your new server...');
                    window.location.href = `/servers/${result.data.identifier || result.data.id}`;
                } else {

                    alert(`Deployment failed: ${result.error || 'Unknown error occurred'}`);
                    deployButton.disabled = false;
                    deployButton.innerHTML = originalButtonText;
                }
            } catch (error) {
                alert('Failed to deploy server. Please try again or contact support.');
                deployButton.disabled = false;
                deployButton.innerHTML = originalButtonText;
            }
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

    populateLocations();
    initializeNodeContainer();
    setupSelectionCards();
    switchTab('appearance');

    setTimeout(() => {
        setupSelectionCards();
        updateNavigationButtons();
        updateSummary();
    }, 500);
})();