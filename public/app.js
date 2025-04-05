function toggleDropdown(id, button) {
    const allDropdowns = document.querySelectorAll('.dropdown');
    allDropdowns.forEach(dropdown => {
        if (dropdown.id !== id) {
            dropdown.classList.add('hidden');
        }
    });

    const dropdown = document.getElementById(`dropdown_${id}`);
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

function toggleTab(id) {
    let allTabs = document.querySelectorAll('.tab-btn');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.classList.remove('bg-zinc-900');
        tab.classList.add('text-zinc-400');
        tab.classList.add('hover:bg-zinc-800/70');
        tab.classList.add('hover:text-zinc-200');
    });

    let allContents = document.querySelectorAll('.tab-content');
    allContents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('flex');
    });

    let selectedButton = document.getElementById(`tab-${id}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.classList.add('bg-zinc-900');
        selectedButton.classList.add('text-zinc-100');
        selectedButton.classList.remove('text-zinc-400');
        selectedButton.classList.remove('hover:bg-zinc-800/70');
        selectedButton.classList.remove('hover:text-zinc-200');
    }
    let selectedContent = document.getElementById(`tab-content-${id}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('flex');
    }
}

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