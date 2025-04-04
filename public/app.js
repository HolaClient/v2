function toggleDropdown(id, button) {
    const allDropdowns = document.querySelectorAll('.dropdown');
    allDropdowns.forEach(dropdown => {
        if (dropdown.id !== id) {
            dropdown.classList.add('hidden');
        }
    });

    const dropdown = document.getElementById(`dropdown_${id}`);
    console.log(dropdown)
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
    document.addEventListener('click', function (event) {
        if (!button.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
    });
}
function toggleSearchBar() {
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) {
        searchOverlay.classList.toggle('hidden');
        if (!searchOverlay.classList.contains('hidden')) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
    } else {
        createSearchOverlay();
    }
}

function createSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 z-50';
    
    overlay.innerHTML = `
        <div class="w-full max-w-2xl bg-zinc-900 rounded-xl p-4 border border-zinc-800 shadow-lg">
            <div class="flex items-center mb-4">
                <input id="searchInput" type="text" placeholder="Search..." 
                       class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button onclick="toggleSearchBar()" class="ml-2 p-2 text-zinc-400 hover:text-zinc-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" 
                         stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div id="searchResults" class="max-h-96 overflow-y-auto"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    searchInput.focus();
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleSearchBar();
    });
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '<p class="text-zinc-500 p-2">Type at least 2 characters to search</p>';
        return;
    }
    
    searchResults.innerHTML = '<p class="text-zinc-500 p-2">Searching...</p>';
    
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) throw new Error('Search failed');
            return response.json();
        })
        .then(data => {
            if (data.results && data.results.length > 0) {
                searchResults.innerHTML = data.results.map(result => `
                    <a href="${result.url}" class="block p-2 hover:bg-zinc-800 rounded">
                        <div class="font-medium text-zinc-200">${result.title}</div>
                        <div class="text-sm text-zinc-400">${result.description}</div>
                    </a>
                `).join('');
            } else {
                searchResults.innerHTML = '<p class="text-zinc-500 p-2">No results found</p>';
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            searchResults.innerHTML = '<p class="text-zinc-500 p-2">Error searching. Please try again.</p>';
        });
}