(function() {
        const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const messageElement = document.getElementById('ptero-message');
    
        const state = {
        pteroData: {
            locations: [],
            nodes: [],
            softwares: []
        },
        pteroResources: {
            locations: [],
            nodes: [],
            eggs: []
        },
        tabs: ['locations', 'nodes', 'softwares'],
        currentTabIndex: 0,
        pagination: {
            locations: { page: 1, perPage: 9, total: 0, filtered: [] },
            nodes: { page: 1, perPage: 9, total: 0, filtered: [] },
            softwares: { page: 1, perPage: 9, total: 0, filtered: [] },
            pteroLocations: { page: 1, perPage: 6, total: 0, filtered: [] },
            pteroNodes: { page: 1, perPage: 6, total: 0, filtered: [] },
            pteroSoftwares: { page: 1, perPage: 6, total: 0, filtered: [] }
        }
    };
    
        init();
    
    function init() {
        switchTab('locations');
        setupEventListeners();
        fetchConfig();
    }
    
    function setupEventListeners() {
                tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.id.replace('tab-', '');
                switchTab(tabId);
            });
        });
        
                addEventListenerIfExists('close-location-slide', 'click', () => closeSlide('location-slide'));
        addEventListenerIfExists('close-node-slide', 'click', () => closeSlide('node-slide'));
        addEventListenerIfExists('close-software-slide', 'click', () => closeSlide('software-slide'));
        
        addEventListenerIfExists('close-add-location-modal', 'click', () => closeModal('add-location-modal'));
        addEventListenerIfExists('close-add-node-modal', 'click', () => closeModal('add-node-modal'));
        addEventListenerIfExists('close-add-software-modal', 'click', () => closeModal('add-software-modal'));
        
        addEventListenerIfExists('add-location', 'click', () => {
            renderPterodactylLocations();
            openModal('add-location-modal');
        });
        
        addEventListenerIfExists('add-node', 'click', () => {
            renderPterodactylNodes();
            openModal('add-node-modal');
        });
        
        addEventListenerIfExists('add-software', 'click', () => {
            renderPterodactylEggs();
            openModal('add-software-modal');
        });
        
                setupFormListeners();
    }
    
    function addEventListenerIfExists(id, event, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, callback);
        }
    }
    
    function setupFormListeners() {
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
                    fee: parseFloat(document.getElementById('location-fee').value) || 1.0,
                    description: document.getElementById('location-description').value
                };
                
                saveLocation(locationData);
            });
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
                    fee: parseFloat(document.getElementById('node-fee').value) || 1.0,
                    description: document.getElementById('node-description').value
                };
                
                saveNode(nodeData);
            });
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
                    fee: parseFloat(document.getElementById('software-fee').value) || 1.0,
                    description: document.getElementById('software-description').value
                };
                
                saveSoftware(softwareData);
            });
        }
    }
    
    function saveLocation(locationData) {
        const existingIndex = state.pteroData.locations.findIndex(l => l.id === locationData.id);
        if (existingIndex >= 0) {
            state.pteroData.locations[existingIndex] = locationData;
        } else {
            state.pteroData.locations.push(locationData);
        }
        
        saveConfig();
        closeSlide('location-slide');
        state.pagination.locations.filtered = state.pteroData.locations;
        renderConfiguredLocations();
    }
    
    function saveNode(nodeData) {
        const existingIndex = state.pteroData.nodes.findIndex(n => n.id === nodeData.id);
        if (existingIndex >= 0) {
            state.pteroData.nodes[existingIndex] = nodeData;
        } else {
            state.pteroData.nodes.push(nodeData);
        }
        
        saveConfig();
        closeSlide('node-slide');
        state.pagination.nodes.filtered = state.pteroData.nodes;
        renderConfiguredNodes();
    }
    
    function saveSoftware(softwareData) {
        const existingIndex = state.pteroData.softwares.findIndex(s => s.id === softwareData.id);
        if (existingIndex >= 0) {
            state.pteroData.softwares[existingIndex] = softwareData;
        } else {
            state.pteroData.softwares.push(softwareData);
        }
        
        saveConfig();
        closeSlide('software-slide');
        state.pagination.softwares.filtered = state.pteroData.softwares;
        renderConfiguredSoftware();
    }
    
    function fetchConfig() {
        Promise.all([
            fetch('/api/admin/pterodactyl/config').then(res => res.json()).catch(err => ({ success: false, error: err.message })),
            fetch('/api/admin/pterodactyl/locations').then(res => res.json()).catch(err => ({ success: false, error: err.message })),
            fetch('/api/admin/pterodactyl/nodes').then(res => res.json()).catch(err => ({ success: false, error: err.message })),
            fetch('/api/admin/pterodactyl/nests').then(res => res.json()).catch(err => ({ success: false, error: err.message }))
        ])
        .then(([configData, locationsData, nodesData, nestsData]) => {
                        if (configData.success && configData.config) {
                state.pteroData = configData.config;
                if (!state.pteroData.locations) state.pteroData.locations = [];
                if (!state.pteroData.nodes) state.pteroData.nodes = [];
                if (!state.pteroData.softwares) state.pteroData.softwares = [];
            }
            
                        if (locationsData.success) {
                state.pteroResources.locations = locationsData.data || [];
            }
            
                        if (nodesData.success) {
                state.pteroResources.nodes = nodesData.data || [];
            }
            
                        if (nestsData.success) {
                processNestsData(nestsData);
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
    
    function processNestsData(nestsData) {
        state.pteroResources.eggs = [];
        
        (nestsData.data || []).forEach(nest => {
            if (nest.attributes && nest.attributes.relationships && 
                nest.attributes.relationships.eggs && 
                nest.attributes.relationships.eggs.data) {
                
                nest.attributes.relationships.eggs.data.forEach(egg => {
                    if (egg && egg.attributes) {
                        egg.attributes.nest = nest.attributes.name || 'Unknown Nest';
                        state.pteroResources.eggs.push(egg);
                    }
                });
            }
        });
        
                state.pteroResources.eggs.sort((a, b) => {
            const nestNameA = a.attributes && a.attributes.nest ? a.attributes.nest : 'Unknown';
            const nestNameB = b.attributes && b.attributes.nest ? b.attributes.nest : 'Unknown';
            
            const nestComparison = nestNameA.localeCompare(nestNameB);
            
            if (nestComparison === 0 && a.attributes && b.attributes) {
                return (a.attributes.name || '').localeCompare(b.attributes.name || '');
            }
            
            return nestComparison;
        });
    }
    
    function initializeLists() {
                state.pagination.locations.filtered = state.pteroData.locations;
        state.pagination.nodes.filtered = state.pteroData.nodes;
        state.pagination.softwares.filtered = state.pteroData.softwares;
        state.pagination.pteroLocations.filtered = state.pteroResources.locations;
        state.pagination.pteroNodes.filtered = state.pteroResources.nodes;
        state.pagination.pteroSoftwares.filtered = state.pteroResources.eggs;
        
                updateTotalPages();
        
                updateAllPaginationDisplays();
        
                setupSearchAndPagination();
    }
    
    function updateTotalPages() {
        state.pagination.locations.total = Math.ceil(state.pagination.locations.filtered.length / state.pagination.locations.perPage) || 1;
        state.pagination.nodes.total = Math.ceil(state.pagination.nodes.filtered.length / state.pagination.nodes.perPage) || 1;
        state.pagination.softwares.total = Math.ceil(state.pagination.softwares.filtered.length / state.pagination.softwares.perPage) || 1;
        state.pagination.pteroLocations.total = Math.ceil(state.pagination.pteroLocations.filtered.length / state.pagination.pteroLocations.perPage) || 1;
        state.pagination.pteroNodes.total = Math.ceil(state.pagination.pteroNodes.filtered.length / state.pagination.pteroNodes.perPage) || 1;
        state.pagination.pteroSoftwares.total = Math.ceil(state.pagination.pteroSoftwares.filtered.length / state.pagination.pteroSoftwares.perPage) || 1;
    }
    
    function updateAllPaginationDisplays() {
        updatePaginationDisplay('location', state.pagination.locations);
        updatePaginationDisplay('node', state.pagination.nodes);
        updatePaginationDisplay('software', state.pagination.softwares);
        updatePaginationDisplay('ptero-location', state.pagination.pteroLocations);
        updatePaginationDisplay('ptero-node', state.pagination.pteroNodes);
        updatePaginationDisplay('ptero-software', state.pagination.pteroSoftwares);
    }
    
    function switchTab(tabId) {
                tabButtons.forEach(btn => {
            btn.classList.remove('bg-zinc-900', 'text-zinc-100');
            btn.classList.add('text-zinc-400', 'hover:bg-zinc-800/70', 'hover:text-zinc-200');
        });
        
                tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
                const activeButton = document.getElementById(`tab-${tabId}`);
        if (activeButton) {
            activeButton.classList.remove('text-zinc-400', 'hover:bg-zinc-800/70', 'hover:text-zinc-200');
            activeButton.classList.add('bg-zinc-900', 'text-zinc-100');
        }
        
                const activeContent = document.getElementById(`content-${tabId}`);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }
        
        state.currentTabIndex = state.tabs.indexOf(tabId);
    }
    
    function showMessage(message, isError = false) {
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.classList.remove('hidden', 'bg-green-600', 'bg-red-600');
        messageElement.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);
    }
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    }
    
    function openSlide(slideId) {
        const slide = document.getElementById(slideId);
        if (!slide) return;
        
        slide.classList.remove('hidden');
        setTimeout(() => {
            slide.classList.remove('translate-x-full');
            document.body.classList.add('overflow-hidden');
        }, 10);
    }
    
    function closeSlide(slideId) {
        const slide = document.getElementById(slideId);
        if (!slide) return;
        
        slide.classList.add('translate-x-full');
        document.body.classList.remove('overflow-hidden');
        setTimeout(() => {
            slide.classList.add('hidden');
        }, 300);
    }
    
    function setupSearchAndPagination() {
        setupSearchInput('location-search', state.pteroData.locations, state.pagination.locations, renderConfiguredLocations);
        setupSearchInput('node-search', state.pteroData.nodes, state.pagination.nodes, renderConfiguredNodes);
        setupSearchInput('software-search', state.pteroData.softwares, state.pagination.softwares, renderConfiguredSoftware);
        setupPteroSearchInput('ptero-location-search', 'locations', renderPterodactylLocations);
        setupPteroSearchInput('ptero-node-search', 'nodes', renderPterodactylNodes);
        setupPteroSearchInput('ptero-software-search', 'eggs', renderPterodactylEggs);
        
        setupPaginationButtons('location', state.pagination.locations, renderConfiguredLocations);
        setupPaginationButtons('node', state.pagination.nodes, renderConfiguredNodes);
        setupPaginationButtons('software', state.pagination.softwares, renderConfiguredSoftware);
        setupPaginationButtons('ptero-location', state.pagination.pteroLocations, renderPterodactylLocations);
        setupPaginationButtons('ptero-node', state.pagination.pteroNodes, renderPterodactylNodes);
        setupPaginationButtons('ptero-software', state.pagination.pteroSoftwares, renderPterodactylEggs);
    }
    
    function setupSearchInput(inputId, dataArray, paginationData, renderCallback) {
        const searchInput = document.getElementById(inputId);
        if (!searchInput) return;
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            
            try {
                const regex = new RegExp(query, 'i');
                paginationData.filtered = dataArray.filter(item => 
                    (item.name && regex.test(item.name)) || 
                    (item.displayName && regex.test(item.displayName)) || 
                    (item.description && regex.test(item.description))
                );
            } catch (e) {
                paginationData.filtered = dataArray.filter(item => 
                    (item.name && item.name.toLowerCase().includes(query)) || 
                    (item.displayName && item.displayName.toLowerCase().includes(query)) || 
                    (item.description && item.description.toLowerCase().includes(query))
                );
            }
            
            paginationData.page = 1;
            paginationData.total = Math.ceil(paginationData.filtered.length / paginationData.perPage) || 1;
            
            renderCallback();
        });
    }
    
    function setupPteroSearchInput(inputId, resourceType, renderCallback) {
        const searchInput = document.getElementById(inputId);
        if (!searchInput) return;
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            let resources, paginationData;
            
            switch (resourceType) {
                case 'locations':
                    resources = state.pteroResources.locations;
                    paginationData = state.pagination.pteroLocations;
                    
                    try {
                        const regex = new RegExp(query, 'i');
                        paginationData.filtered = resources.filter(location => 
                            (location.attributes && location.attributes.short && regex.test(location.attributes.short)) || 
                            (location.attributes && location.attributes.long && regex.test(location.attributes.long)) ||
                            (location.id && regex.test(location.id.toString()))
                        );
                    } catch (e) {
                        paginationData.filtered = resources.filter(location => 
                            (location.attributes && location.attributes.short && location.attributes.short.toLowerCase().includes(query)) || 
                            (location.attributes && location.attributes.long && location.attributes.long.toLowerCase().includes(query)) ||
                            (location.id && location.id.toString().includes(query))
                        );
                    }
                    break;
                    
                case 'nodes':
                    resources = state.pteroResources.nodes;
                    paginationData = state.pagination.pteroNodes;
                    
                    try {
                        const regex = new RegExp(query, 'i');
                        paginationData.filtered = resources.filter(node => 
                            (node.attributes && node.attributes.name && regex.test(node.attributes.name)) ||
                            (node.attributes && node.attributes.fqdn && regex.test(node.attributes.fqdn)) ||
                            (node.id && regex.test(node.id.toString()))
                        );
                    } catch (e) {
                        paginationData.filtered = resources.filter(node => 
                            (node.attributes && node.attributes.name && node.attributes.name.toLowerCase().includes(query)) ||
                            (node.attributes && node.attributes.fqdn && node.attributes.fqdn.toLowerCase().includes(query)) ||
                            (node.id && node.id.toString().includes(query))
                        );
                    }
                    break;
                    
                case 'eggs':
                    resources = state.pteroResources.eggs;
                    paginationData = state.pagination.pteroSoftwares;
                    
                    try {
                        const regex = new RegExp(query, 'i');
                        paginationData.filtered = resources.filter(egg => 
                            (egg.attributes && egg.attributes.name && regex.test(egg.attributes.name)) || 
                            (egg.attributes && egg.attributes.nest && regex.test(egg.attributes.nest)) ||
                            (egg.attributes && egg.attributes.id && regex.test(egg.attributes.id.toString()))
                        );
                    } catch (e) {
                        paginationData.filtered = resources.filter(egg => 
                            (egg.attributes && egg.attributes.name && egg.attributes.name.toLowerCase().includes(query)) || 
                            (egg.attributes && egg.attributes.nest && egg.attributes.nest.toLowerCase().includes(query)) ||
                            (egg.attributes && egg.attributes.id && egg.attributes.id.toString().includes(query))
                        );
                    }
                    break;
            }
            
            paginationData.page = 1;
            paginationData.total = Math.ceil(paginationData.filtered.length / paginationData.perPage) || 1;
            
            renderCallback();
        });
    }
    
    function setupPaginationButtons(prefix, paginationData, renderCallback) {
        const prevBtn = document.querySelector(`#${prefix}-pagination .pagination-prev`);
        const nextBtn = document.querySelector(`#${prefix}-pagination .pagination-next`);
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                if (paginationData.page > 1) {
                    paginationData.page--;
                    updatePaginationDisplay(prefix, paginationData);
                    renderCallback();
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (paginationData.page < paginationData.total) {
                    paginationData.page++;
                    updatePaginationDisplay(prefix, paginationData);
                    renderCallback();
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
        
        if (state.pagination.locations.filtered.length === 0) {
            locationsContainer.innerHTML = `
                <div class="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div class="text-center text-zinc-400 py-8">No locations configured. Click "Add Location" to add one.</div>
                </div>
            `;
            state.pagination.locations.total = 1;
            updatePaginationDisplay('location', state.pagination.locations);
            return;
        }
        
        const startIndex = (state.pagination.locations.page - 1) * state.pagination.locations.perPage;
        const endIndex = Math.min(startIndex + state.pagination.locations.perPage, state.pagination.locations.filtered.length);
        const paginatedLocations = state.pagination.locations.filtered.slice(startIndex, endIndex);
        
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
        
        state.pagination.locations.total = Math.ceil(state.pagination.locations.filtered.length / state.pagination.locations.perPage) || 1;
        updatePaginationDisplay('location', state.pagination.locations);
        
        attachLocationEventListeners();
    }
    
        
    function populateLocationForm(location) {
        const fields = {
            'location-id': location.id || '',
            'location-name': location.name || '',
            'location-display-name': location.displayName || location.name || '',
            'location-image': location.image || '',
            'location-fee': location.fee || 1.0,
            'location-description': location.description || ''
        };
        
        Object.keys(fields).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = fields[id];
        });
    }
    
    function populateNodeForm(node) {
        const fields = {
            'node-id': node.id || '',
            'node-name': node.name || '',
            'node-display-name': node.displayName || node.name || '',
            'node-image': node.image || '',
            'node-fee': node.fee || 1.0,
            'node-description': node.description || ''
        };
        
        Object.keys(fields).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = fields[id];
        });
    }
    
    function populateSoftwareForm(software) {
        const fields = {
            'software-id': software.id || '',
            'software-name': software.name || '',
            'software-display-name': software.displayName || software.name || '',
            'software-image': software.image || '',
            'software-fee': software.fee || 1.0,
            'software-description': software.description || ''
        };
        
        Object.keys(fields).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = fields[id];
        });
    }
    
    function attachLocationEventListeners() {
        document.querySelectorAll('.edit-location').forEach(btn => {
            btn.addEventListener('click', function() {
                const locationId = this.getAttribute('data-id');
                const location = state.pteroData.locations.find(l => l.id === locationId);
                
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
                    state.pteroData.locations = state.pteroData.locations.filter(l => l.id !== locationId);
                    saveConfig();
                    state.pagination.locations.filtered = state.pteroData.locations;
                    state.pagination.locations.page = 1;
                    state.pagination.locations.total = Math.ceil(state.pagination.locations.filtered.length / state.pagination.locations.perPage) || 1;
                    renderConfiguredLocations();
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
            body: JSON.stringify(state.pteroData)
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
    
        function handleApiError(error, message) {
        console.error(error);
        showMessage(message || 'An error occurred', true);
    }
})();