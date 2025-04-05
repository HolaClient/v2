(async function () {
    let [pterodactyl, configured] = await Promise.all([
        fetch("/api/admin/pterodactyl/deploy").then(res => res.json()),
        fetch("/api/admin/deploy").then(res => res.json()),
    ]);
    pterodactyl = pterodactyl.data;
    configured = configured.data;
    window.ConfiguredDeploy = configured;
    let locationsContainer = document.getElementById("locations-container");
    let nodesContainer = document.getElementById("nodes-container");
    let nestsContainer = document.getElementById("nests-container");

    let pterodactylLocationsContainer = document.getElementById("pterodactyl-locations-container");
    let pterodactylNodesContainer = document.getElementById("pterodactyl-nodes-container");
    let pterodactylNestsContainer = document.getElementById("pterodactyl-nests-container");

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

    let locationsForm = document.getElementById("location-form");

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
                    <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition" onclick="toggleModal('pterodactylLocations'), showLocation('${i.id}', '${i.short} ${i.long}')">
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
            } else {
                alert("Error deleting location: " + result.error, "error");
            }
        })
        .catch(error => {
            alert("An error occurred: " + error.message, "error");
        });
    }
}

function showLocation(id, name) {
    toggleModal('location-viewer');
    getElement('location-id').value = id;
    getElement('location-name').value = name;
    getElement('location-display-name').value = '';
    getElement('location-fee').value = 0;
    getElement('location-description').value = '';
    getElement('location-image').value = '';

    document.getElementById('selected-flag').innerHTML = '';
    document.getElementById('selected-country').textContent = 'Select a country';
}