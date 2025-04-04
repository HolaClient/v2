(function() {
    let tabButtons = document.querySelectorAll('.tab-btn');
    let tabContents = document.querySelectorAll('.tab-content');
    
    let pteroData = {
        locations: [],
        nodes: [],
        softwares: []
    };
    
    let pteroResources = {
        locations: [],
        nodes: [],
        eggs: []
    };
    
    let tabs = ['locations', 'nodes', 'softwares'];
    let currentTabIndex = 0;

    let pagination = {
        locations: { page: 1, perPage: 9, total: 0, filtered: [] },
        nodes: { page: 1, perPage: 9, total: 0, filtered: [] },
        softwares: { page: 1, perPage: 9, total: 0, filtered: [] },
        pteroLocations: { page: 1, perPage: 6, total: 0, filtered: [] },
        pteroNodes: { page: 1, perPage: 6, total: 0, filtered: [] },
        pteroSoftwares: { page: 1, perPage: 6, total: 0, filtered: [] }
    };
    
    switchTab('locations');
    
    fetchConfig();
    
    function fetchConfig() {
        Promise.all([
            fetch('/api/admin/pterodactyl/config').then(res => res.json()),
            fetch('/api/admin/pterodactyl/locations').then(res => res.json()),
            fetch('/api/admin/pterodactyl/nodes').then(res => res.json()),
            fetch('/api/admin/pterodactyl/nests').then(res => res.json())
        ])
        .then(([configData, locationsData, nodesData, nestsData]) => {
            if (configData.success && configData.config) {
                pteroData = configData.config;
                if (!pteroData.locations) pteroData.locations = [];
                if (!pteroData.nodes) pteroData.nodes = [];
                if (!pteroData.softwares) pteroData.softwares = [];
            }
            
            if (locationsData.success) {
                pteroResources.locations = locationsData.data || [];
            }
            
            if (nodesData.success) {
                pteroResources.nodes = nodesData.data || [];
            }
            
            if (nestsData.success) {
                pteroResources.eggs = [];
                
                (nestsData.data || []).forEach(nest => {
                    if (nest.attributes && nest.attributes.relationships && 
                        nest.attributes.relationships.eggs && 
                        nest.attributes.relationships.eggs.data) {
                        
                        nest.attributes.relationships.eggs.data.forEach(egg => {
                            if (egg && egg.attributes) {
                                egg.attributes.nest = nest.attributes.name || 'Unknown Nest';
                                pteroResources.eggs.push(egg);
                            }
                        });
                    }
                });
                
                pteroResources.eggs.sort((a, b) => {
                    const nestNameA = a.attributes && a.attributes.nest ? a.attributes.nest : 'Unknown';
                    const nestNameB = b.attributes && b.attributes.nest ? b.attributes.nest : 'Unknown';
                    
                    const nestComparison = nestNameA.localeCompare(nestNameB);
                    
                    if (nestComparison === 0 && a.attributes && b.attributes) {
                        return (a.attributes.name || '').localeCompare(b.attributes.name || '');
                    }
                    
                    return nestComparison;
                });
            }
            
            initializeLists();
            
            renderConfiguredLocations();
            renderConfiguredNodes();
            renderConfiguredSoftware();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showMessage('Error loading configuration data', true);
        });
    }
    
    function switchTab(tabId) {
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
        
        let activeContent = document.getElementById(`content-${tabId}`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        currentTabIndex = tabs.indexOf(tabId);
    }
    
    function showMessage(message, isError = false) {
        const msgElement = document.getElementById('ptero-message');
        msgElement.textContent = message;
        msgElement.classList.remove('hidden', 'bg-green-600', 'bg-red-600');
        msgElement.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
        
        setTimeout(() => {
            msgElement.classList.add('hidden');
        }, 3000);
    }
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }
    
    function openSlide(slideId) {
        const slide = document.getElementById(slideId);
        slide.classList.remove('hidden');
        setTimeout(() => {
            slide.classList.remove('translate-x-full');
            document.body.classList.add('overflow-hidden');
        }, 10);
    }
    
    function closeSlide(slideId) {
        const slide = document.getElementById(slideId);
        slide.classList.add('translate-x-full');
        document.body.classList.remove('overflow-hidden');
        setTimeout(() => {
            slide.classList.add('hidden');
        }, 300);
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            let tabId = button.id.replace('tab-', '');
            switchTab(tabId);
        });
    });
    
    document.getElementById('close-location-slide')?.addEventListener('click', () => closeSlide('location-slide'));
    document.getElementById('close-node-slide')?.addEventListener('click', () => closeSlide('node-slide'));
    document.getElementById('close-software-slide')?.addEventListener('click', () => closeSlide('software-slide'));
    
    document.getElementById('close-add-location-modal')?.addEventListener('click', () => closeModal('add-location-modal'));
    document.getElementById('close-add-node-modal')?.addEventListener('click', () => closeModal('add-node-modal'));
    document.getElementById('close-add-software-modal')?.addEventListener('click', () => closeModal('add-software-modal'));
    
    document.getElementById('add-location')?.addEventListener('click', () => {
        renderPterodactylLocations();
        openModal('add-location-modal');
    });
    
    document.getElementById('add-node')?.addEventListener('click', () => {
        renderPterodactylNodes();
        openModal('add-node-modal');
    });
    
    document.getElementById('add-software')?.addEventListener('click', () => {
        renderPterodactylEggs();
        openModal('add-software-modal');
    });
    
    function initializeLists() {
        pagination.locations.filtered = pteroData.locations;
        pagination.nodes.filtered = pteroData.nodes;
        pagination.softwares.filtered = pteroData.softwares;
        pagination.pteroLocations.filtered = pteroResources.locations;
        pagination.pteroNodes.filtered = pteroResources.nodes;
        pagination.pteroSoftwares.filtered = pteroResources.eggs;
        
        pagination.locations.total = Math.ceil(pagination.locations.filtered.length / pagination.locations.perPage);
        pagination.nodes.total = Math.ceil(pagination.nodes.filtered.length / pagination.nodes.perPage);
        pagination.softwares.total = Math.ceil(pagination.softwares.filtered.length / pagination.softwares.perPage);
        pagination.pteroLocations.total = Math.ceil(pagination.pteroLocations.filtered.length / pagination.pteroLocations.perPage);
        pagination.pteroNodes.total = Math.ceil(pagination.pteroNodes.filtered.length / pagination.pteroNodes.perPage);
        pagination.pteroSoftwares.total = Math.ceil(pagination.pteroSoftwares.filtered.length / pagination.pteroSoftwares.perPage);
        
        updatePaginationDisplay('location', pagination.locations);
        updatePaginationDisplay('node', pagination.nodes);
        updatePaginationDisplay('software', pagination.softwares);
        updatePaginationDisplay('ptero-location', pagination.pteroLocations);
        updatePaginationDisplay('ptero-node', pagination.pteroNodes);
        updatePaginationDisplay('ptero-software', pagination.pteroSoftwares);
        
        setupSearchAndPagination();
    }
    
    function setupSearchAndPagination() {
        const locationSearch = document.getElementById('location-search');
        if (locationSearch) {
            locationSearch.addEventListener('input', () => {
                const query = locationSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.locations.filtered = pteroData.locations.filter(location => 
                        (location.name && regex.test(location.name)) || 
                        (location.displayName && regex.test(location.displayName)) || 
                        (location.description && regex.test(location.description))
                    );
                } catch (e) {
                    pagination.locations.filtered = pteroData.locations.filter(location => 
                        (location.name && location.name.toLowerCase().includes(query)) || 
                        (location.displayName && location.displayName.toLowerCase().includes(query)) || 
                        (location.description && location.description.toLowerCase().includes(query))
                    );
                }
                pagination.locations.page = 1;
                pagination.locations.total = Math.ceil(pagination.locations.filtered.length / pagination.locations.perPage);
                renderConfiguredLocations();
            });
        }
        
        const nodeSearch = document.getElementById('node-search');
        if (nodeSearch) {
            nodeSearch.addEventListener('input', () => {
                const query = nodeSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.nodes.filtered = pteroData.nodes.filter(node => 
                        (node.name && regex.test(node.name)) || 
                        (node.displayName && regex.test(node.displayName)) || 
                        (node.description && regex.test(node.description))
                    );
                } catch (e) {
                    pagination.nodes.filtered = pteroData.nodes.filter(node => 
                        (node.name && node.name.toLowerCase().includes(query)) || 
                        (node.displayName && node.displayName.toLowerCase().includes(query)) || 
                        (node.description && node.description.toLowerCase().includes(query))
                    );
                }
                pagination.nodes.page = 1;
                pagination.nodes.total = Math.ceil(pagination.nodes.filtered.length / pagination.nodes.perPage);
                renderConfiguredNodes();
            });
        }
        
        const softwareSearch = document.getElementById('software-search');
        if (softwareSearch) {
            softwareSearch.addEventListener('input', () => {
                const query = softwareSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.softwares.filtered = pteroData.softwares.filter(software => 
                        (software.name && regex.test(software.name)) || 
                        (software.displayName && regex.test(software.displayName)) || 
                        (software.description && regex.test(software.description))
                    );
                } catch (e) {
                    pagination.softwares.filtered = pteroData.softwares.filter(software => 
                        (software.name && software.name.toLowerCase().includes(query)) || 
                        (software.displayName && software.displayName.toLowerCase().includes(query)) || 
                        (software.description && software.description.toLowerCase().includes(query))
                    );
                }
                pagination.softwares.page = 1;
                pagination.softwares.total = Math.ceil(pagination.softwares.filtered.length / pagination.softwares.perPage);
                renderConfiguredSoftware();
            });
        }
        
        const pteroLocationSearch = document.getElementById('ptero-location-search');
        if (pteroLocationSearch) {
            pteroLocationSearch.addEventListener('input', () => {
                const query = pteroLocationSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.pteroLocations.filtered = pteroResources.locations.filter(location => 
                        (location.attributes && location.attributes.short && regex.test(location.attributes.short)) || 
                        (location.attributes && location.attributes.long && regex.test(location.attributes.long)) ||
                        (location.id && regex.test(location.id.toString()))
                    );
                } catch (e) {
                    pagination.pteroLocations.filtered = pteroResources.locations.filter(location => 
                        (location.attributes && location.attributes.short && location.attributes.short.toLowerCase().includes(query)) || 
                        (location.attributes && location.attributes.long && location.attributes.long.toLowerCase().includes(query)) ||
                        (location.id && location.id.toString().includes(query))
                    );
                }
                pagination.pteroLocations.page = 1;
                pagination.pteroLocations.total = Math.ceil(pagination.pteroLocations.filtered.length / pagination.pteroLocations.perPage);
                renderPterodactylLocations();
            });
        }
        
        const pteroNodeSearch = document.getElementById('ptero-node-search');
        if (pteroNodeSearch) {
            pteroNodeSearch.addEventListener('input', () => {
                const query = pteroNodeSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.pteroNodes.filtered = pteroResources.nodes.filter(node => 
                        (node.attributes && node.attributes.name && regex.test(node.attributes.name)) ||
                        (node.attributes && node.attributes.fqdn && regex.test(node.attributes.fqdn)) ||
                        (node.id && regex.test(node.id.toString()))
                    );
                } catch (e) {
                    pagination.pteroNodes.filtered = pteroResources.nodes.filter(node => 
                        (node.attributes && node.attributes.name && node.attributes.name.toLowerCase().includes(query)) ||
                        (node.attributes && node.attributes.fqdn && node.attributes.fqdn.toLowerCase().includes(query)) ||
                        (node.id && node.id.toString().includes(query))
                    );
                }
                pagination.pteroNodes.page = 1;
                pagination.pteroNodes.total = Math.ceil(pagination.pteroNodes.filtered.length / pagination.pteroNodes.perPage);
                renderPterodactylNodes();
            });
        }
        
        const pteroSoftwareSearch = document.getElementById('ptero-software-search');
        if (pteroSoftwareSearch) {
            pteroSoftwareSearch.addEventListener('input', () => {
                const query = pteroSoftwareSearch.value.toLowerCase();
                try {
                    const regex = new RegExp(query, 'i');
                    pagination.pteroSoftwares.filtered = pteroResources.eggs.filter(egg => 
                        (egg.attributes && egg.attributes.name && regex.test(egg.attributes.name)) || 
                        (egg.attributes && egg.attributes.nest && regex.test(egg.attributes.nest)) ||
                        (egg.attributes && egg.attributes.id && regex.test(egg.attributes.id.toString()))
                    );
                } catch (e) {
                    pagination.pteroSoftwares.filtered = pteroResources.eggs.filter(egg => 
                        (egg.attributes && egg.attributes.name && egg.attributes.name.toLowerCase().includes(query)) || 
                        (egg.attributes && egg.attributes.nest && egg.attributes.nest.toLowerCase().includes(query)) ||
                        (egg.attributes && egg.attributes.id && egg.attributes.id.toString().includes(query))
                    );
                }
                pagination.pteroSoftwares.page = 1;
                pagination.pteroSoftwares.total = Math.ceil(pagination.pteroSoftwares.filtered.length / pagination.pteroSoftwares.perPage);
                renderPterodactylEggs();
            });
        }
        
        setupPaginationButtons('location', pagination.locations);
        setupPaginationButtons('node', pagination.nodes);
        setupPaginationButtons('software', pagination.softwares);
        setupPaginationButtons('ptero-location', pagination.pteroLocations);
        setupPaginationButtons('ptero-node', pagination.pteroNodes);
        setupPaginationButtons('ptero-software', pagination.pteroSoftwares);
    }
    
    function setupPaginationButtons(prefix, paginationData) {
        const prevBtn = document.querySelector(`#${prefix}-pagination .pagination-prev`);
        const nextBtn = document.querySelector(`#${prefix}-pagination .pagination-next`);
        const currentPageEl = document.getElementById(`${prefix}-current-page`);
        const totalPagesEl = document.getElementById(`${prefix}-total-pages`);
        
        if (prevBtn && nextBtn && currentPageEl && totalPagesEl) {
            prevBtn.addEventListener('click', () => {
                if (paginationData.page > 1) {
                    paginationData.page--;
                    updatePaginationDisplay(prefix, paginationData);
                    
                    switch(prefix) {
                        case 'location': renderConfiguredLocations(); break;
                        case 'node': renderConfiguredNodes(); break;
                        case 'software': renderConfiguredSoftware(); break;
                        case 'ptero-location': renderPterodactylLocations(); break;
                        case 'ptero-node': renderPterodactylNodes(); break;
                        case 'ptero-software': renderPterodactylEggs(); break;
                    }
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (paginationData.page < paginationData.total) {
                    paginationData.page++;
                    updatePaginationDisplay(prefix, paginationData);
                    
                    switch(prefix) {
                        case 'location': renderConfiguredLocations(); break;
                        case 'node': renderConfiguredNodes(); break;
                        case 'software': renderConfiguredSoftware(); break;
                        case 'ptero-location': renderPterodactylLocations(); break;
                        case 'ptero-node': renderPterodactylNodes(); break;
                        case 'ptero-software': renderPterodactylEggs(); break;
                    }
                }
            });
        }
    }
    
    function updatePaginationDisplay(prefix, paginationData) {
        const prevBtn = document.querySelector(`#${prefix}-pagination .pagination-prev`);
        const nextBtn = document.querySelector(`#${prefix}-pagination .pagination-next`);
        const currentPageEl = document.getElementById(`${prefix}-current-page`);
        const totalPagesEl = document.getElementById(`${prefix}-total-pages`);
        
        if (prevBtn && nextBtn && currentPageEl && totalPagesEl) {
            prevBtn.disabled = paginationData.page <= 1;
            nextBtn.disabled = paginationData.page >= paginationData.total;
            
            currentPageEl.textContent = paginationData.page;
            totalPagesEl.textContent = paginationData.total || 1;
        }
    }
    
    function renderConfiguredLocations() {
        const locationsContainer = document.getElementById('locations-list-container');
        if (!locationsContainer) return;
        
        locationsContainer.innerHTML = '';
        
        if (pagination.locations.filtered.length === 0) {
            locationsContainer.innerHTML = `
                <div class="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No locations configured. Click "Add Location" to add one.</div>
                </div>
            `;
            pagination.locations.total = 1;
            updatePaginationDisplay('location', pagination.locations);
            return;
        }
        
        const startIndex = (pagination.locations.page - 1) * pagination.locations.perPage;
        const endIndex = Math.min(startIndex + pagination.locations.perPage, pagination.locations.filtered.length);
        const paginatedLocations = pagination.locations.filtered.slice(startIndex, endIndex);
        
        paginatedLocations.forEach(location => {
            const card = document.createElement('div');
            card.className = 'bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col';
            
            const placeholderChar = (location.displayName || location.name || 'L').charAt(0);
            const safeChar = encodeURIComponent(placeholderChar);
            const fallbackImageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='30' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3E${safeChar}%3C/text%3E%3C/svg%3E`;
            
            card.innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="w-16 h-16 mr-3 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        ${location.image ? 
                            `<img src="${location.image}" alt="${location.displayName || location.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${fallbackImageUrl}';" />` :
                            `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">${placeholderChar}</div>`
                        }
                    </div>
                    <div class="flex-1">
                        <h3 class="text-zinc-200 font-medium truncate">${location.displayName || location.name}</h3>
                        <p class="text-zinc-400 text-sm">ID: ${location.id}</p>
                    </div>
                </div>
                <p class="text-zinc-400 text-sm mb-3 line-clamp-2">${location.description || 'No description'}</p>
                <div class="mt-auto">
                    <div class="flex items-center justify-between">
                        <span class="text-zinc-400 text-sm">Fee: ${location.fee || 1.0}x</span>
                        <div class="flex space-x-2">
                            <button class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors edit-location" data-id="${location.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button class="p-1.5 rounded-lg bg-red-800/40 hover:bg-red-700/60 transition-colors delete-location" data-id="${location.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            locationsContainer.appendChild(card);
        });
        
        pagination.locations.total = Math.ceil(pagination.locations.filtered.length / pagination.locations.perPage) || 1;
        updatePaginationDisplay('location', pagination.locations);
        
        document.querySelectorAll('.edit-location').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-id');
                const location = pteroData.locations.find(l => l.id === locationId);
                
                if (location) {
                    populateLocationForm(location);
                    openSlide('location-slide');
                }
            });
        });
        
        document.querySelectorAll('.delete-location').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this location configuration?')) {
                    pteroData.locations = pteroData.locations.filter(l => l.id !== locationId);
                    saveConfig();
                    pagination.locations.filtered = pteroData.locations;
                    pagination.locations.page = 1;
                    pagination.locations.total = Math.ceil(pagination.locations.filtered.length / pagination.locations.perPage) || 1;
                    renderConfiguredLocations();
                }
            });
        });
    }
    
    function renderPterodactylLocations() {
        const pteroLocationsContainer = document.getElementById('ptero-locations-list');
        if (!pteroLocationsContainer) return;
        
        pteroLocationsContainer.innerHTML = '';
        
        if (pagination.pteroLocations.filtered.length === 0) {
            pteroLocationsContainer.innerHTML = `
                <div class="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No locations found in Pterodactyl</div>
                </div>
            `;
            pagination.pteroLocations.total = 1;
            updatePaginationDisplay('ptero-location', pagination.pteroLocations);
            return;
        }
        
        const startIndex = (pagination.pteroLocations.page - 1) * pagination.pteroLocations.perPage;
        const endIndex = Math.min(startIndex + pagination.pteroLocations.perPage, pagination.pteroLocations.filtered.length);
        const paginatedLocations = pagination.pteroLocations.filtered.slice(startIndex, endIndex);
        
        paginatedLocations.forEach(location => {
            const isConfigured = pteroData.locations.some(l => l.id === location.id);
            
            const card = document.createElement('div');
            card.className = 'bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col';
            
            card.innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-zinc-800 text-zinc-300 rounded-lg w-12 h-12 flex items-center justify-center text-xl font-bold mr-3">
                        ${location.attributes.short.charAt(0)}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-zinc-200 font-medium">${location.attributes.short}</h3>
                        <p class="text-zinc-400 text-sm">ID: ${location.id}</p>
                    </div>
                </div>
                <p class="text-zinc-400 text-sm mb-4">${location.attributes.long}</p>
                <div class="mt-auto flex justify-end">
                    ${isConfigured ? 
                        `<span class="px-3 py-1.5 rounded-lg bg-green-800/40 text-green-400 text-xs">Already Configured</span>` :
                        `<button class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-sm configure-ptero-location" data-id="${location.id}">
                            Configure
                         </button>`
                    }
                </div>
            `;
            
            pteroLocationsContainer.appendChild(card);
        });
        
        pagination.pteroLocations.total = Math.ceil(pagination.pteroLocations.filtered.length / pagination.pteroLocations.perPage) || 1;
        updatePaginationDisplay('ptero-location', pagination.pteroLocations);
        
        document.querySelectorAll('.configure-ptero-location').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-id');
                const location = pteroResources.locations.find(l => l.id === locationId);
                
                if (location) {
                    const locationData = {
                        id: locationId,
                        name: location.attributes.short,
                        displayName: location.attributes.short,
                        image: '',
                        fee: 1.0,
                        description: location.attributes.long
                    };
                    
                    populateLocationForm(locationData);
                    closeModal('add-location-modal');
                    openSlide('location-slide');
                }
            });
        });
    }
    
    function renderConfiguredNodes() {
        const nodesContainer = document.getElementById('nodes-list-container');
        if (!nodesContainer) return;
        
        nodesContainer.innerHTML = '';
        
        if (pagination.nodes.filtered.length === 0) {
            nodesContainer.innerHTML = `
                <div class="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No nodes configured. Click "Add Node" to add one.</div>
                </div>
            `;
            pagination.nodes.total = 1;
            updatePaginationDisplay('node', pagination.nodes);
            return;
        }
        
        const startIndex = (pagination.nodes.page - 1) * pagination.nodes.perPage;
        const endIndex = Math.min(startIndex + pagination.nodes.perPage, pagination.nodes.filtered.length);
        const paginatedNodes = pagination.nodes.filtered.slice(startIndex, endIndex);
        
        paginatedNodes.forEach(node => {
            const pteroNode = pteroResources.nodes.find(n => n.id === node.id);
            const locationId = pteroNode?.attributes?.location_id;
            const location = pteroData.locations.find(l => l.id === locationId);
            
            const card = document.createElement('div');
            card.className = 'bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col';
            
            const placeholderChar = (node.displayName || node.name || 'N').charAt(0);
            const safeChar = encodeURIComponent(placeholderChar);
            const fallbackImageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='30' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3E${safeChar}%3C/text%3E%3C/svg%3E`;
            
            card.innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="w-16 h-16 mr-3 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        ${node.image ? 
                            `<img src="${node.image}" alt="${node.displayName || node.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${fallbackImageUrl}';" />` :
                            `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">${placeholderChar}</div>`
                        }
                    </div>
                    <div class="flex-1">
                        <h3 class="text-zinc-200 font-medium truncate">${node.displayName || node.name}</h3>
                        <p class="text-zinc-400 text-sm">ID: ${node.id}</p>
                    </div>
                </div>
                ${location ? 
                    `<div class="mb-2">
                        <span class="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300">
                            ${location.displayName || location.name}
                        </span>
                    </div>` : ''}
                <p class="text-zinc-400 text-sm mb-3 line-clamp-2">${node.description || 'No description'}</p>
                <div class="mt-auto">
                    <div class="flex items-center justify-between">
                        <span class="text-zinc-400 text-sm">Fee: ${node.fee || 1.0}x</span>
                        <div class="flex space-x-2">
                            <button class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors edit-node" data-id="${node.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button class="p-1.5 rounded-lg bg-red-800/40 hover:bg-red-700/60 transition-colors delete-node" data-id="${node.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            nodesContainer.appendChild(card);
        });
        
        pagination.nodes.total = Math.ceil(pagination.nodes.filtered.length / pagination.nodes.perPage) || 1;
        updatePaginationDisplay('node', pagination.nodes);
        
        document.querySelectorAll('.edit-node').forEach(btn => {
            btn.addEventListener('click', function() {
                const nodeId = this.getAttribute('data-id');
                const node = pteroData.nodes.find(n => n.id === nodeId);
                
                if (node) {
                    populateNodeForm(node);
                    openSlide('node-slide');
                }
            });
        });
        
        document.querySelectorAll('.delete-node').forEach(btn => {
            btn.addEventListener('click', function() {
                const nodeId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this node configuration?')) {
                    pteroData.nodes = pteroData.nodes.filter(n => n.id !== nodeId);
                    saveConfig();
                    pagination.nodes.filtered = pteroData.nodes;
                    pagination.nodes.page = 1;
                    pagination.nodes.total = Math.ceil(pagination.nodes.filtered.length / pagination.nodes.perPage) || 1;
                    renderConfiguredNodes();
                }
            });
        });
    }
    
    function renderPterodactylNodes() {
        const pteroNodesContainer = document.getElementById('ptero-node-locations');
        if (!pteroNodesContainer) return;
        
        pteroNodesContainer.innerHTML = '';
        
        if (pagination.pteroNodes.filtered.length === 0) {
            pteroNodesContainer.innerHTML = `
                <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No nodes found in Pterodactyl</div>
                </div>
            `;
            pagination.pteroNodes.total = 1;
            updatePaginationDisplay('ptero-node', pagination.pteroNodes);
            return;
        }
        
        const nodesByLocation = {};
        
        const startIndex = (pagination.pteroNodes.page - 1) * pagination.pteroNodes.perPage;
        const endIndex = Math.min(startIndex + pagination.pteroNodes.perPage, pagination.pteroNodes.filtered.length);
        const paginatedNodes = pagination.pteroNodes.filtered.slice(startIndex, endIndex);
        
        paginatedNodes.forEach(node => {
            const locationId = node.attributes.location_id;
            if (!nodesByLocation[locationId]) {
                nodesByLocation[locationId] = [];
            }
            nodesByLocation[locationId].push(node);
        });
        
        Object.keys(nodesByLocation).forEach(locationId => {
            const location = pteroResources.locations.find(l => l.id == locationId);
            const locationName = location ? location.attributes.short : `Location ID: ${locationId}`;
            
            const locationGroup = document.createElement('div');
            locationGroup.className = 'mb-4';
            locationGroup.innerHTML = `
                <h4 class="text-zinc-300 font-medium mb-2">${locationName}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${nodesByLocation[locationId].map(node => {
                        const isConfigured = pteroData.nodes.some(n => n.id == node.id);
                        
                        return `
                            <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                <div class="flex items-center mb-2">
                                    <div class="flex-1">
                                        <h5 class="text-zinc-200 font-medium">${node.attributes.name}</h5>
                                        <p class="text-zinc-400 text-xs">${node.attributes.fqdn}</p>
                                    </div>
                                </div>
                                <div class="flex justify-end mt-2">
                                    ${isConfigured ? 
                                        `<span class="px-2 py-1 rounded-lg bg-green-800/40 text-green-400 text-xs">Already Configured</span>` :
                                        `<button class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-xs configure-ptero-node" data-id="${node.id}">
                                            Configure
                                         </button>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            pteroNodesContainer.appendChild(locationGroup);
        });
        
        pagination.pteroNodes.total = Math.ceil(pagination.pteroNodes.filtered.length / pagination.pteroNodes.perPage) || 1;
        updatePaginationDisplay('ptero-node', pagination.pteroNodes);
        
        document.querySelectorAll('.configure-ptero-node').forEach(btn => {
            btn.addEventListener('click', function() {
                const nodeId = this.getAttribute('data-id');
                const node = pteroResources.nodes.find(n => n.id == nodeId);
                
                if (node) {
                    const nodeData = {
                        id: nodeId,
                        name: node.attributes.name,
                        displayName: node.attributes.name,
                        image: '',
                        fee: 1.0,
                        description: ''
                    };
                    
                    populateNodeForm(nodeData);
                    closeModal('add-node-modal');
                    openSlide('node-slide');
                }
            });
        });
    }
    
    function renderConfiguredSoftware() {
        const softwaresContainer = document.getElementById('softwares-list-container');
        if (!softwaresContainer) return;
        
        softwaresContainer.innerHTML = '';
        
        if (pagination.softwares.filtered.length === 0) {
            softwaresContainer.innerHTML = `
                <div class="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No software configured. Click "Add Software" to add one.</div>
                </div>
            `;
            pagination.softwares.total = 1;
            updatePaginationDisplay('software', pagination.softwares);
            return;
        }
        
        const startIndex = (pagination.softwares.page - 1) * pagination.softwares.perPage;
        const endIndex = Math.min(startIndex + pagination.softwares.perPage, pagination.softwares.filtered.length);
        const paginatedSoftwares = pagination.softwares.filtered.slice(startIndex, endIndex);
        
        paginatedSoftwares.forEach(software => {
            const egg = pteroResources.eggs.find(e => e.attributes && e.attributes.id == software.id);
            
            const card = document.createElement('div');
            card.className = 'bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col';
            
            const placeholderChar = (software.displayName || software.name || 'S').charAt(0);
            const safeChar = encodeURIComponent(placeholderChar);
            const fallbackImageUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='30' fill='%23FFF' text-anchor='middle' dominant-baseline='middle'%3E${safeChar}%3C/text%3E%3C/svg%3E`;
            
            card.innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="w-16 h-16 mr-3 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        ${software.image ? 
                            `<img src="${software.image}" alt="${software.displayName || software.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${fallbackImageUrl}';" />` :
                            `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">${placeholderChar}</div>`
                        }
                    </div>
                    <div class="flex-1">
                        <h3 class="text-zinc-200 font-medium truncate">${software.displayName || software.name}</h3>
                        <p class="text-zinc-400 text-sm">ID: ${software.id}</p>
                    </div>
                </div>
                ${egg ? 
                    `<div class="mb-2">
                        <span class="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300">
                            ${egg.attributes.nest}
                        </span>
                    </div>` : ''}
                <p class="text-zinc-400 text-sm mb-3 line-clamp-2">${software.description || 'No description'}</p>
                <div class="mt-auto">
                    <div class="flex items-center justify-between">
                        <span class="text-zinc-400 text-sm">Fee: ${software.fee || 1.0}x</span>
                        <div class="flex space-x-2">
                            <button class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors edit-software" data-id="${software.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button class="p-1.5 rounded-lg bg-red-800/40 hover:bg-red-700/60 transition-colors delete-software" data-id="${software.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            softwaresContainer.appendChild(card);
        });
        
        pagination.softwares.total = Math.ceil(pagination.softwares.filtered.length / pagination.softwares.perPage) || 1;
        updatePaginationDisplay('software', pagination.softwares);
        
        document.querySelectorAll('.edit-software').forEach(btn => {
            btn.addEventListener('click', function() {
                const softwareId = this.getAttribute('data-id');
                const software = pteroData.softwares.find(s => s.id === softwareId);
                
                if (software) {
                    populateSoftwareForm(software);
                    openSlide('software-slide');
                }
            });
        });
        
        document.querySelectorAll('.delete-software').forEach(btn => {
            btn.addEventListener('click', function() {
                const softwareId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this software configuration?')) {
                    pteroData.softwares = pteroData.softwares.filter(s => s.id !== softwareId);
                    saveConfig();
                    pagination.softwares.filtered = pteroData.softwares;
                    pagination.softwares.page = 1;
                    pagination.softwares.total = Math.ceil(pagination.softwares.filtered.length / pagination.softwares.perPage) || 1;
                    renderConfiguredSoftware();
                }
            });
        });
    }
    
    function renderPterodactylEggs() {
        const pteroSoftwareContainer = document.getElementById('ptero-software-nests');
        if (!pteroSoftwareContainer) return;
        
        pteroSoftwareContainer.innerHTML = '';
        
        if (pagination.pteroSoftwares.filtered.length === 0) {
            pteroSoftwareContainer.innerHTML = `
                <div class="text-center text-zinc-400 py-8">
                    No eggs found in Pterodactyl
                </div>
            `;
            pagination.pteroSoftwares.total = 1;
            updatePaginationDisplay('ptero-software', pagination.pteroSoftwares);
            return;
        }
        
        const eggsByNest = {};
        
        const startIndex = (pagination.pteroSoftwares.page - 1) * pagination.pteroSoftwares.perPage;
        const endIndex = Math.min(startIndex + pagination.pteroSoftwares.perPage, pagination.pteroSoftwares.filtered.length);
        const paginatedEggs = pagination.pteroSoftwares.filtered.slice(startIndex, endIndex);
        
        paginatedEggs.forEach(egg => {
            const nestName = egg.attributes && egg.attributes.nest ? egg.attributes.nest : 'Uncategorized';
            if (!eggsByNest[nestName]) {
                eggsByNest[nestName] = [];
            }
            eggsByNest[nestName].push(egg);
        });
        
        const sortedNestNames = Object.keys(eggsByNest).sort();
        
        sortedNestNames.forEach(nestName => {
            const nestGroup = document.createElement('div');
            nestGroup.className = 'mb-4';
            nestGroup.innerHTML = `
                <h4 class="text-zinc-300 font-medium mb-2">${nestName}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${eggsByNest[nestName].map(egg => {
                        const isConfigured = pteroData.softwares.some(s => s.id == egg.attributes.id);
                        
                        return `
                            <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                                <div class="flex items-center mb-2">
                                    <div class="flex-1">
                                        <h5 class="text-zinc-200 font-medium">${egg.attributes.name || 'Unknown Egg'}</h5>
                                        <p class="text-zinc-400 text-xs">ID: ${egg.attributes.id}</p>
                                    </div>
                                </div>
                                <div class="flex justify-end mt-2">
                                    ${isConfigured ? 
                                        `<span class="px-2 py-1 rounded-lg bg-green-800/40 text-green-400 text-xs">Already Configured</span>` :
                                        `<button class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-xs configure-ptero-egg" data-id="${egg.attributes.id}">
                                            Configure
                                         </button>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            pteroSoftwareContainer.appendChild(nestGroup);
        });
        
        pagination.pteroSoftwares.total = Math.ceil(pagination.pteroSoftwares.filtered.length / pagination.pteroSoftwares.perPage) || 1;
        updatePaginationDisplay('ptero-software', pagination.pteroSoftwares);
        
        document.querySelectorAll('.configure-ptero-egg').forEach(btn => {
            btn.addEventListener('click', function() {
                const eggId = this.getAttribute('data-id');
                const egg = pteroResources.eggs.find(e => e.attributes && e.attributes.id == eggId);
                
                if (egg) {
                    const softwareData = {
                        id: egg.attributes.id,
                        name: egg.attributes.name || 'Unknown Software',
                        displayName: egg.attributes.name || 'Unknown Software',
                        image: '',
                        fee: 1.0,
                        description: egg.attributes.description || ''
                    };
                    
                    populateSoftwareForm(softwareData);
                    closeModal('add-software-modal');
                    openSlide('software-slide');
                }
            });
        });
    }
    
    function saveConfig() {
        fetch('/api/admin/pterodactyl/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pteroData)
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showMessage('Failed to save configuration: ' + (data.error || 'Unknown error'), true);
            } else {
                showMessage('Configuration saved successfully');
            }
        })
        .catch(error => {
            console.error('Error saving configuration:', error);
            showMessage('Failed to connect to server', true);
        });
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function populateLocationForm(location) {
        document.getElementById('location-id').value = location.id;
        document.getElementById('location-name').value = location.name;
        document.getElementById('location-display-name').value = location.displayName || location.name;
        document.getElementById('location-image').value = location.image || '';
        document.getElementById('location-fee').value = location.fee || 1.0;
        document.getElementById('location-description').value = location.description || '';
    }

    const locationForm = document.getElementById('location-form');
    if (locationForm) {
        locationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const locationId = document.getElementById('location-id').value;
            const locationData = {
                id: locationId,
                name: document.getElementById('location-name').value,
                displayName: document.getElementById('location-display-name').value,
                image: document.getElementById('location-image').value,
                fee: parseFloat(document.getElementById('location-fee').value),
                description: document.getElementById('location-description').value
            };
            
            const existingIndex = pteroData.locations.findIndex(l => l.id === locationId);
            if (existingIndex >= 0) {
                pteroData.locations[existingIndex] = locationData;
            } else {
                pteroData.locations.push(locationData);
            }
            
            saveConfig();
            closeSlide('location-slide');
            pagination.locations.filtered = pteroData.locations;
            renderConfiguredLocations();
        });
    }

    function populateNodeForm(node) {
        document.getElementById('node-id').value = node.id;
        document.getElementById('node-name').value = node.name;
        document.getElementById('node-display-name').value = node.displayName || node.name;
        document.getElementById('node-image').value = node.image || '';
        document.getElementById('node-fee').value = node.fee || 1.0;
        document.getElementById('node-description').value = node.description || '';
    }

    const nodeForm = document.getElementById('node-form');
    if (nodeForm) {
        nodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nodeId = document.getElementById('node-id').value;
            const nodeData = {
                id: nodeId,
                name: document.getElementById('node-name').value,
                displayName: document.getElementById('node-display-name').value,
                image: document.getElementById('node-image').value,
                fee: parseFloat(document.getElementById('node-fee').value),
                description: document.getElementById('node-description').value
            };
            
            const existingIndex = pteroData.nodes.findIndex(n => n.id === nodeId);
            if (existingIndex >= 0) {
                pteroData.nodes[existingIndex] = nodeData;
            } else {
                pteroData.nodes.push(nodeData);
            }
            
            saveConfig();
            closeSlide('node-slide');
            pagination.nodes.filtered = pteroData.nodes;
            renderConfiguredNodes();
        });
    }

    function populateSoftwareForm(software) {
        document.getElementById('software-id').value = software.id;
        document.getElementById('software-name').value = software.name;
        document.getElementById('software-display-name').value = software.displayName || software.name;
        document.getElementById('software-image').value = software.image || '';
        document.getElementById('software-fee').value = software.fee || 1.0;
        document.getElementById('software-description').value = software.description || '';
    }

    const softwareForm = document.getElementById('software-form');
    if (softwareForm) {
        softwareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const softwareId = document.getElementById('software-id').value;
            const softwareData = {
                id: softwareId,
                name: document.getElementById('software-name').value,
                displayName: document.getElementById('software-display-name').value,
                image: document.getElementById('software-image').value,
                fee: parseFloat(document.getElementById('software-fee').value),
                description: document.getElementById('software-description').value
            };
            
            const existingIndex = pteroData.softwares.findIndex(s => s.id === softwareId);
            if (existingIndex >= 0) {
                pteroData.softwares[existingIndex] = softwareData;
            } else {
                pteroData.softwares.push(softwareData);
            }
            
            saveConfig();
            closeSlide('software-slide');
            pagination.softwares.filtered = pteroData.softwares;
            renderConfiguredSoftware();
        });
    }
})();