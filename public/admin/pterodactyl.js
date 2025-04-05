(async function () {
    let [pterodactyl, configured] = await Promise.all([
        fetch("/api/admin/pterodactyl/deploy").then(res => res.json()),
        fetch("/api/admin/deploy").then(res => res.json()),
    ]);
    pterodactyl = pterodactyl.data;
    configured = configured.data;
    window.ConfiguredDeploy = configured;
    let locationsContainer = document.getElementById("locations-container");
    let nodesContainer = document.getElementById("nodes-list-container");
    let softwaresContainer = document.getElementById("softwares-list-container");

    let pterodactylLocationsContainer = document.getElementById("pterodactyl-locations-container");
    let pterodactylNodesContainer = document.getElementById("ptero-node-locations");
    let pterodactylNestsContainer = document.getElementById("ptero-software-nests");

    initCountrySelector();

    if (configured.locations && configured.locations.length > 0) {
        locationsContainer.innerHTML = "";
        locationsContainer.innerHTML = fillConfiguredLocations(configured.locations);
    } else {
        document.getElementById("locations-status").innerText = `No locations configured, please configure them by clicking "Add Location" button above.`;
    }

    if (pterodactyl.locations && pterodactyl.locations.length > 0) {
        pterodactylLocationsContainer.innerHTML = "";
        pterodactylLocationsContainer.innerHTML = fillLocations(pterodactyl.locations);
    } else {
        document.getElementById("pterodactyl-locationsStatus").innerText = `No locations found in Pterodactyl panel, please add locations in Pterodactyl panel.`;
    }

    if (configured.nodes && configured.nodes.length > 0) {
        nodesContainer.innerHTML = "";
        nodesContainer.innerHTML = fillConfiguredNodes(configured.nodes);
    } else {
        nodesContainer.innerHTML = `<div class="w-full text-center text-zinc-400 py-4">No nodes configured, please configure them by clicking "Add Node" button above.</div>`;
    }

    if (pterodactyl.nodes && pterodactyl.nodes.length > 0) {
        pterodactylNodesContainer.innerHTML = "";
        pterodactylNodesContainer.innerHTML = fillNodes(pterodactyl.nodes);
    } else {
        pterodactylNodesContainer.innerHTML = `<div class="w-full text-center text-zinc-400 py-4">No nodes found in Pterodactyl panel.</div>`;
    }

    if (configured.eggs && configured.eggs.length > 0) {
        softwaresContainer.innerHTML = "";
        softwaresContainer.innerHTML = fillConfiguredSoftware(configured.eggs);
    } else {
        softwaresContainer.innerHTML = `<div class="w-full text-center text-zinc-400 py-4">No software configured, please configure them by clicking "Add Software" button above.</div>`;
    }

    if (pterodactyl.nests && pterodactyl.nests.length > 0) {
        pterodactylNestsContainer.innerHTML = "";
        pterodactylNestsContainer.innerHTML = fillNests(pterodactyl.nests);
    } else {
        pterodactylNestsContainer.innerHTML = `<div class="w-full text-center text-zinc-400 py-4">No nests/eggs found in Pterodactyl panel.</div>`;
    }

    let locationsForm = document.getElementById("location-form");
    let nodeForm = document.getElementById("node-form");
    let softwareForm = document.getElementById("software-form");

    locationsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let name = getElement("location-name").value;
        let displayName = getElement("location-display-name").value;
        let image = getElement("location-image").value;
        let id = getElement("location-id").value;
        let fee = getElement("location-fee").value;
        let description = getElement("location-description").value;
        let country = getElement("location-country").value;

        let locations = configured.locations || [];
        let location = {
            id,
            name,
            displayName,
            image,
            fee,
            description,
            country: JSON.parse(country)
        };

        let existingLocationIndex = locations.findIndex(loc => loc.id === id);
        if (existingLocationIndex !== -1) {
            locations[existingLocationIndex] = location;
        } else {
            locations.push(location);
        }

        let response = await fetch("/api/admin/pterodactyl/deploy/locations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ locations }),
        });

        let result = await response.json();
        if (result.success) {
            locationsContainer.innerHTML = fillConfiguredLocations(locations);
            configured.locations = locations;
            displayMessage("Location saved successfully", "success");
        } else {
            displayMessage("Error updating location: " + result.error, "error");
        }

        toggleModal("location-viewer");
    });

    nodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let name = getElement("node-name").value;
        let displayName = getElement("node-display-name").value;
        let image = getElement("node-image").value;
        let id = getElement("node-id").value;
        let fee = getElement("node-fee").value;
        let description = getElement("node-description").value;

        let nodes = configured.nodes || [];
        let node = {
            id,
            name,
            displayName,
            image,
            fee,
            description
        };

        let existingNodeIndex = nodes.findIndex(n => n.id === id);
        if (existingNodeIndex !== -1) {
            nodes[existingNodeIndex] = node;
        } else {
            nodes.push(node);
        }

        let response = await fetch("/api/admin/pterodactyl/deploy/nodes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nodes }),
        });

        let result = await response.json();
        if (result.success) {
            nodesContainer.innerHTML = fillConfiguredNodes(nodes);
            configured.nodes = nodes;
            displayMessage("Node saved successfully", "success");
        } else {
            displayMessage("Error updating node: " + result.error, "error");
        }

        document.getElementById("node-slide").classList.add("translate-x-full");
        document.getElementById("node-slide").classList.remove("flex");
        document.getElementById("node-slide").classList.add("hidden");
    });

    softwareForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let name = getElement("software-name").value;
        let displayName = getElement("software-display-name").value;
        let image = getElement("software-image").value;
        let id = getElement("software-id").value;
        let fee = getElement("software-fee").value;
        let description = getElement("software-description").value;

        let softwares = configured.eggs || [];
        let software = {
            id,
            name,
            displayName,
            image,
            fee,
            description
        };

        let existingSoftwareIndex = softwares.findIndex(s => s.id === id);
        if (existingSoftwareIndex !== -1) {
            softwares[existingSoftwareIndex] = software;
        } else {
            softwares.push(software);
        }

        let response = await fetch("/api/admin/pterodactyl/deploy/softwares", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ softwares }),
        });

        let result = await response.json();
        if (result.success) {
            softwaresContainer.innerHTML = fillConfiguredSoftware(softwares);
            configured.eggs = softwares;
            displayMessage("Software saved successfully", "success");
        } else {
            displayMessage("Error updating software: " + result.error, "error");
        }

        document.getElementById("software-slide").classList.add("translate-x-full");
        document.getElementById("software-slide").classList.remove("flex");
        document.getElementById("software-slide").classList.add("hidden");
    });

    document.getElementById("add-node").addEventListener("click", function() {
        document.getElementById("add-node-modal").classList.remove("hidden");
        document.getElementById("add-node-modal").classList.add("flex");
    });

    document.getElementById("close-add-node-modal").addEventListener("click", function() {
        document.getElementById("add-node-modal").classList.add("hidden");
        document.getElementById("add-node-modal").classList.remove("flex");
    });

    document.getElementById("close-node-slide").addEventListener("click", function() {
        document.getElementById("node-slide").classList.add("translate-x-full");
        document.getElementById("node-slide").classList.remove("flex");
        document.getElementById("node-slide").classList.add("hidden");
    });

    document.getElementById("add-software").addEventListener("click", function() {
        document.getElementById("add-software-modal").classList.remove("hidden");
        document.getElementById("add-software-modal").classList.add("flex");
    });

    document.getElementById("close-add-software-modal").addEventListener("click", function() {
        document.getElementById("add-software-modal").classList.add("hidden");
        document.getElementById("add-software-modal").classList.remove("flex");
    });

    document.getElementById("close-software-slide").addEventListener("click", function() {
        document.getElementById("software-slide").classList.add("translate-x-full");
        document.getElementById("software-slide").classList.remove("flex");
        document.getElementById("software-slide").classList.add("hidden");
    });

    document.getElementById("close-add-location-modal").addEventListener("click", function() {
        document.getElementById("modal-pterodactylLocations").classList.add("hidden");
        document.getElementById("modal-pterodactylLocations").classList.remove("flex");
    });

    const addLocationBtn = document.querySelector("button[onclick=\"toggleModal('pterodactylLocations')\"]");
    if (addLocationBtn) {
        addLocationBtn.addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("modal-pterodactylLocations").classList.remove("hidden");
            document.getElementById("modal-pterodactylLocations").classList.add("flex");
        });
    }

    const nodeSearch = document.getElementById("node-search");
    if (nodeSearch) {
        nodeSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            if (configured.nodes && configured.nodes.length > 0) {
                const filteredNodes = configured.nodes.filter(node => 
                    node.name.toLowerCase().includes(query) || 
                    (node.displayName && node.displayName.toLowerCase().includes(query))
                );
                nodesContainer.innerHTML = fillConfiguredNodes(filteredNodes);
            }
        });
    }

    const pteroNodeSearch = document.getElementById("ptero-node-search");
    if (pteroNodeSearch) {
        pteroNodeSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            if (pterodactyl.nodes && pterodactyl.nodes.length > 0) {
                const filteredNodes = pterodactyl.nodes.filter(node => 
                    node.attributes.name.toLowerCase().includes(query) || 
                    node.attributes.fqdn.toLowerCase().includes(query)
                );
                pterodactylNodesContainer.innerHTML = fillNodes(filteredNodes);
            }
        });
    }

    const softwareSearch = document.getElementById("software-search");
    if (softwareSearch) {
        softwareSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            if (configured.eggs && configured.eggs.length > 0) {
                const filteredSoftware = configured.eggs.filter(software => 
                    software.name.toLowerCase().includes(query) || 
                    (software.displayName && software.displayName.toLowerCase().includes(query))
                );
                softwaresContainer.innerHTML = fillConfiguredSoftware(filteredSoftware);
            }
        });
    }

    const pteroSoftwareSearch = document.getElementById("ptero-software-search");
    if (pteroSoftwareSearch) {
        pteroSoftwareSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            if (pterodactyl.nests && pterodactyl.nests.length > 0) {
                const filteredNests = pterodactyl.nests.filter(nest => {
                    if (nest.attributes.name.toLowerCase().includes(query)) return true;
                    
                    if (nest.attributes.relationships && 
                        nest.attributes.relationships.eggs && 
                        nest.attributes.relationships.eggs.data) {
                        return nest.attributes.relationships.eggs.data.some(egg => 
                            egg.attributes.name.toLowerCase().includes(query)
                        );
                    }
                    return false;
                });
                pterodactylNestsContainer.innerHTML = fillNests(filteredNests);
            }
        });
    }

    const pteroLocationSearch = document.getElementById("ptero-location-search");
    if (pteroLocationSearch) {
        pteroLocationSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            if (pterodactyl.locations && pterodactyl.locations.length > 0) {
                const filteredLocations = pterodactyl.locations.filter(location => 
                    location.attributes.short.toLowerCase().includes(query) || 
                    (location.attributes.long && location.attributes.long.toLowerCase().includes(query))
                );
                pterodactylLocationsContainer.innerHTML = fillLocations(filteredLocations);
            }
        });
    }

    function displayMessage(message, type = "info") {
        const messageEl = document.getElementById("ptero-message");
        messageEl.textContent = message;
        messageEl.classList.remove("hidden");
        messageEl.classList.add("flex");

        if (type === "success") {
            messageEl.classList.add("bg-emerald-600");
            messageEl.classList.remove("bg-red-600");
        } else if (type === "error") {
            messageEl.classList.add("bg-red-600");
            messageEl.classList.remove("bg-emerald-600");
        }

        setTimeout(() => {
            messageEl.classList.add("hidden");
            messageEl.classList.remove("flex");
        }, 3000);
    }

    function initCountrySelector() {
        const countrySelector = document.getElementById('country-selector');
        const countryDropdown = document.getElementById('country-dropdown');
        const selectedFlag = document.getElementById('selected-flag');
        const selectedCountry = document.getElementById('selected-country');
        const countriesList = document.getElementById('countries-list');
        const countrySearch = document.getElementById('country-search');
        const locationImage = document.getElementById('location-image');

        fetch('/assets/countries.json')
            .then(response => response.json())
            .then(result => {
                populateCountries(result);

                countrySelector.addEventListener('click', () => {
                    countryDropdown.classList.toggle('hidden');
                });

                document.addEventListener('click', (e) => {
                    if (!countrySelector.contains(e.target) && !countryDropdown.contains(e.target)) {
                        countryDropdown.classList.add('hidden');
                    }
                });

                countrySearch.addEventListener('input', () => {
                    const query = countrySearch.value.toLowerCase();
                    const filteredCountries = result.filter(country =>
                        country.name.toLowerCase().includes(query)
                    );
                    populateCountries(filteredCountries);
                });
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
                countriesList.innerHTML = `<div class="text-center text-red-500 py-2">Error loading countries. Please try again.</div>`;
            });

        function populateCountries(countries) {
            countriesList.innerHTML = '';

            if (countries.length === 0) {
                countriesList.innerHTML = `<div class="text-center text-zinc-400 py-2">No countries found.</div>`;
                return;
            }

            countries.forEach(country => {
                const countryItem = document.createElement('div');
                countryItem.className = 'flex items-center p-2 hover:bg-zinc-800 rounded-lg cursor-pointer';
                countryItem.innerHTML = `
                    <img src="${country.flag}" alt="${country.name} flag" class="w-6 h-4 mr-2 object-cover rounded">
                    <span class="text-zinc-300">${country.name}</span>
                `;

                countryItem.addEventListener('click', () => {
                    selectedFlag.innerHTML = `<img src="${country.flag}" alt="${country.name} flag" class="w-6 h-4 object-cover rounded">`;
                    selectedCountry.textContent = country.name;
                    locationImage.value = country.flag;
                    countryDropdown.classList.add('hidden');
                    getElement("location-country").value = JSON.stringify(country);
                });

                countriesList.appendChild(countryItem);
            });
        }
    }

    function fillConfiguredLocations(locations) {
        if (locations.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No locations configured, please add locations.</div>`;
        }

        let temp = `
        <table class="w-full border-collapse">
            <thead>
                <tr class="bg-zinc-800/70 text-left">
                    <th class="p-3 rounded-tl-lg text-zinc-300">Country</th>
                    <th class="p-3 text-zinc-300">Name</th>
                    <th class="p-3 text-zinc-300">Display Name</th>
                    <th class="p-3 text-zinc-300">Fee</th>
                    <th class="p-3 text-zinc-300">Description</th>
                    <th class="p-3 rounded-tr-lg text-zinc-300 text-right">Action</th>
                </tr>
            </thead>
            <tbody>`;

        for (let i of locations) {
            temp += `
            <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td class="p-3 text-zinc-300 flex items-center">
                    <img src="${i.image || "/assets/img/icons/locations.svg"}" class="w-6 h-4 rounded object-cover" alt="Location Flag"/>
                    <span class="pl-2 p-3 text-zinc-300">${i?.country?.name}</span>
                </td>
                <td class="p-3 text-zinc-300">${i.name}</td>
                <td class="p-3 text-zinc-300">${i.displayName || "-"}</td>
                <td class="p-3 text-zinc-300">${i.fee || "0"}</td>
                <td class="p-3 text-zinc-300 truncate">${i.description || "-"}</td>
                <td class="p-3 text-right">
                    <div class="flex justify-end gap-2">
                        <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="editLocation('${i.id}')">
                            Edit
                        </button>
                        <button class="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white transition" onclick="deleteLocation('${i.id}')">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>`;
        };

        temp += `
            </tbody>
        </table>`;

        return temp;
    }

    function fillConfiguredNodes(nodes) {
        if (nodes.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No nodes configured, please add nodes.</div>`;
        }

        let temp = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

        for (let node of nodes) {
            temp += `
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <img src="${node.image || "/assets/img/icons/node.svg"}" class="w-8 h-8 rounded object-cover" alt="Node Icon"/>
                        <div class="ml-3">
                            <h3 class="text-zinc-200 font-medium">${node.displayName || node.name}</h3>
                            <p class="text-zinc-400 text-sm">${node.name}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="editNode('${node.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        <button class="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white transition" onclick="deleteNode('${node.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="text-zinc-400 text-sm mb-3 flex-grow">
                    <p class="line-clamp-2">${node.description || "No description provided."}</p>
                </div>
                <div class="flex justify-between text-sm text-zinc-400 mt-2">
                    <span>Fee: ${node.fee ?? 0}</span>
                    <span>ID: ${node.id}</span>
                </div>
            </div>`;
        }

        temp += `</div>`;
        return temp;
    }

    function fillConfiguredSoftware(softwares) {
        if (softwares.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No software configured, please add software.</div>`;
        }

        let temp = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

        for (let software of softwares) {
            temp += `
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col w-full">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <img src="${software.image || "/assets/img/icons/software.svg"}" class="w-8 h-8 rounded object-cover" alt="Software Icon"/>
                        <div class="ml-3">
                            <h3 class="text-zinc-200 font-medium">${software.displayName || software.name}</h3>
                            <p class="text-zinc-400 text-sm">${software.name}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="editSoftware('${software.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        <button class="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white transition" onclick="deleteSoftware('${software.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
                <div class="text-zinc-400 text-sm mb-3 flex-grow">
                    <p class="line-clamp-2">${software.description || "No description provided."}</p>
                </div>
                <div class="flex justify-between text-sm text-zinc-400 mt-2">
                    <span>Fee: ${software.fee ?? 0}</span>
                    <span>ID: ${software.id}</span>
                </div>
            </div>`;
        }

        temp += `</div>`;
        return temp;
    }

    function fillLocations(locations) {
        if (locations.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No locations found in Pterodactyl panel.</div>`;
        }

        let temp = `
        <table class="w-full border-collapse">
            <thead>
                <tr class="bg-zinc-800/70 text-left">
                    <th class="p-3 rounded-tl-lg text-zinc-300">ID</th>
                    <th class="p-3 text-zinc-300">Short Name</th>
                    <th class="p-3 text-zinc-300">Long Name</th>
                    <th class="p-3 rounded-tr-lg text-zinc-300 text-right">Action</th>
                </tr>
            </thead>
            <tbody>`;

        for (let i of locations) {
            i = i.attributes;
            temp += `
            <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td class="p-3 text-zinc-300">${i.id}</td>
                <td class="p-3 text-zinc-300">${i.short}</td>
                <td class="p-3 text-zinc-300">${i.long || "-"}</td>
                <td class="p-3 text-right">
                    <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="toggleModal('location-viewer'), showLocation('${i.id}', '${i.short} ${i.long}')">
                        Add
                    </button>
                </td>
            </tr>`;
        };

        temp += `
            </tbody>
        </table>`;

        return temp;
    }

    function fillNodes(nodes) {
        if (nodes.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No nodes found in Pterodactyl panel.</div>`;
        }

        let temp = `
        <table class="w-full border-collapse">
            <thead>
                <tr class="bg-zinc-800/70 text-left">
                    <th class="p-3 rounded-tl-lg text-zinc-300">ID</th>
                    <th class="p-3 text-zinc-300">Name</th>
                    <th class="p-3 text-zinc-300">FQDN</th>
                    <th class="p-3 rounded-tr-lg text-zinc-300 text-right">Action</th>
                </tr>
            </thead>
            <tbody>`;

        for (let i of nodes) {
            i = i.attributes;
            temp += `
            <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td class="p-3 text-zinc-300">${i.id}</td>
                <td class="p-3 text-zinc-300">${i.name}</td>
                <td class="p-3 text-zinc-300">${i.fqdn || "-"}</td>
                <td class="p-3 text-right">
                    <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="showNode('${i.id}', '${i.name}')">
                        Add
                    </button>
                </td>
            </tr>`;
        };

        temp += `
            </tbody>
        </table>`;

        return temp;
    }

    function fillNests(nests) {
        if (nests.length === 0) {
            return `<div class="w-full text-center text-zinc-400 py-4">No nests/eggs found in Pterodactyl panel.</div>`;
        }

        let temp = '';

        for (let nest of nests) {
            const nestAttr = nest.attributes;
            
            temp += `
            <div class="mb-6">
                <h3 class="text-zinc-200 font-medium mb-2">${nestAttr.name}</h3>
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-zinc-800/70 text-left">
                            <th class="p-3 rounded-tl-lg text-zinc-300">ID</th>
                            <th class="p-3 text-zinc-300">Name</th>
                            <th class="p-3 text-zinc-300">Docker Image</th>
                            <th class="p-3 rounded-tr-lg text-zinc-300 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

            if (nestAttr.relationships && nestAttr.relationships.eggs && nestAttr.relationships.eggs.data) {
                for (let egg of nestAttr.relationships.eggs.data) {
                    const eggAttr = egg.attributes;
                    temp += `
                    <tr class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td class="p-3 text-zinc-300">${eggAttr.id}</td>
                        <td class="p-3 text-zinc-300">${eggAttr.name}</td>
                        <td class="p-3 text-zinc-300">${eggAttr.docker_image || "-"}</td>
                        <td class="p-3 text-right">
                            <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="showSoftware('${eggAttr.id}', '${eggAttr.name}')">
                                Add
                            </button>
                        </td>
                    </tr>`;
                }
            }

            temp += `
                    </tbody>
                </table>
            </div>`;
        }

        return temp;
    }
})();

function toggleModal(id) {
    const modal = document.getElementById(`modal-${id}`);
    if (modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }
}

function getElement(id) {
    return document.getElementById(id);
}

function editLocation(id) {
    let locations = window.ConfiguredDeploy;
    const location = locations.locations.find(loc => loc.id === id);
    toggleModal('location-viewer');

    getElement('location-id').value = location.id;
    getElement('location-name').value = location.name;
    getElement('location-display-name').value = location.displayName || '';
    getElement('location-image').value = location.image || '';
    getElement('location-fee').value = location.fee || 0;
    getElement('location-description').value = location.description || '';
    getElement('location-country').value = JSON.stringify(location.country || {});

    const selectedFlag = document.getElementById('selected-flag');
    const selectedCountry = document.getElementById('selected-country');
    
    if (location.image) {
        selectedFlag.innerHTML = `<img src="${location.image}" alt="Country flag" class="w-6 h-4 object-cover rounded">`;
        selectedCountry.textContent = location.country.name || location.displayName || 'Selected country';
    } else {
        selectedFlag.innerHTML = '';
        selectedCountry.textContent = 'Select a country';
    }
}

function deleteLocation(id) {
    if (confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
        let locations = window.ConfiguredDeploy.locations.filter(loc => loc.id !== id);
        fetch("/api/admin/pterodactyl/deploy/locations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ locations }),
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                window.ConfiguredDeploy.locations = locations;
                const locationsContainer = document.getElementById("locations-container");
                locationsContainer.innerHTML = fillConfiguredLocations(locations);
                displayMessage("Location deleted successfully", "success");
            } else {
                displayMessage("Error deleting location: " + result.error, "error");
            }
        })
        .catch(error => {
            displayMessage("An error occurred: " + error.message, "error");
        });
    }
}

function showLocation(id, name) {
    getElement('location-id').value = id;
    getElement('location-name').value = name;
    getElement('location-display-name').value = '';
    getElement('location-fee').value = 0;
    getElement('location-description').value = '';
    getElement('location-image').value = '';

    document.getElementById('selected-flag').innerHTML = '';
    document.getElementById('selected-country').textContent = 'Select a country';
}

function editNode(id) {
    let nodes = window.ConfiguredDeploy.nodes;
    const node = nodes.find(n => n.id === id);
    
    const nodeSlide = document.getElementById('node-slide');
    nodeSlide.classList.remove('translate-x-full');
    nodeSlide.classList.remove('hidden');
    nodeSlide.classList.add('flex');

    getElement('node-id').value = node.id;
    getElement('node-name').value = node.name;
    getElement('node-display-name').value = node.displayName || '';
    getElement('node-image').value = node.image || '';
    getElement('node-fee').value = node.fee || 1.0;
    getElement('node-description').value = node.description || '';
}

function deleteNode(id) {
    if (confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
        let nodes = window.ConfiguredDeploy.nodes.filter(n => n.id !== id);
        fetch("/api/admin/pterodactyl/deploy/nodes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nodes }),
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                window.ConfiguredDeploy.nodes = nodes;
                const nodesContainer = document.getElementById("nodes-list-container");
                nodesContainer.innerHTML = fillConfiguredNodes(nodes);
                displayMessage("Node deleted successfully", "success");
            } else {
                displayMessage("Error deleting node: " + result.error, "error");
            }
        })
        .catch(error => {
            displayMessage("An error occurred: " + error.message, "error");
        });
    }
}

function showNode(id, name) {
    const nodeSlide = document.getElementById('node-slide');
    nodeSlide.classList.remove('translate-x-full');
    nodeSlide.classList.remove('hidden');
    nodeSlide.classList.add('flex');
    
    const nodeModal = document.getElementById('add-node-modal');
    if (nodeModal && !nodeModal.classList.contains('hidden')) {
        nodeModal.classList.add('hidden');
        nodeModal.classList.remove('flex');
    }
    
    getElement('node-id').value = id;
    getElement('node-name').value = name;
    getElement('node-display-name').value = '';
    getElement('node-image').value = '';
    getElement('node-fee').value = 1.0;
    getElement('node-description').value = '';
}

function editSoftware(id) {
    let softwares = window.ConfiguredDeploy.eggs;
    const software = softwares.find(s => s.id === id);
    
    const softwareSlide = document.getElementById('software-slide');
    softwareSlide.classList.remove('translate-x-full');
    softwareSlide.classList.remove('hidden');
    softwareSlide.classList.add('flex');

    getElement('software-id').value = software.id;
    getElement('software-name').value = software.name;
    getElement('software-display-name').value = software.displayName || '';
    getElement('software-image').value = software.image || '';
    getElement('software-fee').value = software.fee || 1.0;
    getElement('software-description').value = software.description || '';
}

function deleteSoftware(id) {
    if (confirm('Are you sure you want to delete this software? This action cannot be undone.')) {
        let softwares = window.ConfiguredDeploy.eggs.filter(s => s.id !== id);
        fetch("/api/admin/pterodactyl/deploy/softwares", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ softwares }),
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                window.ConfiguredDeploy.eggs = softwares;
                const softwaresContainer = document.getElementById("softwares-list-container");
                softwaresContainer.innerHTML = fillConfiguredSoftware(softwares);
                displayMessage("Software deleted successfully", "success");
            } else {
                displayMessage("Error deleting software: " + result.error, "error");
            }
        })
        .catch(error => {
            displayMessage("An error occurred: " + error.message, "error");
        });
    }
}

function showSoftware(id, name) {
    const softwareSlide = document.getElementById('software-slide');
    softwareSlide.classList.remove('translate-x-full');
    softwareSlide.classList.remove('hidden');
    softwareSlide.classList.add('flex');
    
    getElement('software-id').value = id;
    getElement('software-name').value = name;
    getElement('software-display-name').value = '';
    getElement('software-image').value = '';
    getElement('software-fee').value = 1.0;
    getElement('software-description').value = '';
}

function displayMessage(message, type = "info") {
    const messageEl = document.getElementById("ptero-message");
    messageEl.textContent = message;
    messageEl.classList.remove("hidden");
    messageEl.classList.add("flex");

    if (type === "success") {
        messageEl.classList.add("bg-emerald-600");
        messageEl.classList.remove("bg-red-600");
    } else if (type === "error") {
        messageEl.classList.add("bg-red-600");
        messageEl.classList.remove("bg-emerald-600");
    }

    setTimeout(() => {
        messageEl.classList.add("hidden");
        messageEl.classList.remove("flex");
    }, 3000);
}

function fillConfiguredNodes(nodes) {
    if (nodes.length === 0) {
        return `<div class="w-full text-center text-zinc-400 py-4">No nodes configured, please add nodes.</div>`;
    }

    let temp = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

    for (let node of nodes) {
        temp += `
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <img src="${node.image || "/assets/img/icons/node.svg"}" class="w-8 h-8 rounded object-cover" alt="Node Icon"/>
                    <div class="ml-3">
                        <h3 class="text-zinc-200 font-medium">${node.displayName || node.name}</h3>
                        <p class="text-zinc-400 text-sm">${node.name}</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="editNode('${node.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                    <button class="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white transition" onclick="deleteNode('${node.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="text-zinc-400 text-sm mb-3 flex-grow">
                <p class="line-clamp-2">${node.description || "No description provided."}</p>
            </div>
            <div class="flex justify-between text-sm text-zinc-400 mt-2">
                <span>Fee: ${node.fee || 0}</span>
                <span>ID: ${node.id}</span>
            </div>
        </div>`;
    }

    temp += `</div>`;
    return temp;
}

function fillConfiguredSoftware(softwares) {
    if (softwares.length === 0) {
        return `<div class="w-full text-center text-zinc-400 py-4">No software configured, please add software.</div>`;
    }

    let temp = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

    for (let software of softwares) {
        temp += `
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col h-fit w-full">
            <div class="flex items-center justify-between mb-3 w-full">
                <div class="flex items-center">
                    <img src="${software.image || "/assets/img/icons/software.svg"}" class="w-8 h-8 rounded object-cover" alt="Software Icon"/>
                    <div class="ml-3">
                        <h3 class="text-zinc-200 font-medium">${software.displayName || software.name}</h3>
                        <p class="text-zinc-400 text-sm">${software.name}</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="editSoftware('${software.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                    <button class="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white transition" onclick="deleteSoftware('${software.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="text-zinc-400 text-sm mb-3 flex-grow w-full">
                <p class="line-clamp-2">${software.description || "No description provided."}</p>
            </div>
            <div class="flex justify-between text-sm text-zinc-400 mt-2 w-full">
                <span>Fee: ${software.fee ?? 0}</span>
                <span>ID: ${software.id}</span>
            </div>
        </div>
        `;
    }

    temp += `</div>`;
    return temp;
}