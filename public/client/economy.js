(function () {
    const j4rServersList = document.getElementById('j4r-servers-list');
    const transactionHistory = document.getElementById('transaction-history');
    const generateLinkpaysBtn = document.getElementById('generate-linkpays');
    const generateShareusBtn = document.getElementById('generate-shareus');
    const generateLinkvertiseBtn = document.getElementById('generate-linkvertise');
    const linkModal = document.getElementById('link-modal');
    const modalTitle = document.getElementById('modal-title');
    const generatedLink = document.getElementById('generated-link');
    const openLinkBtn = document.getElementById('open-link');

    window.showModal = function(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    window.hideModal = function(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    function loadJ4RServers() {
        if (!j4rServersList) return;

        fetch('/api/economy/j4r-servers')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.servers && data.servers.length > 0) {
                        j4rServersList.innerHTML = '';
                        
                        data.servers.forEach(server => {
                            const serverElement = document.createElement('div');
                            serverElement.className = 'bg-zinc-800/50 rounded-lg p-4';
                            serverElement.innerHTML = `
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="font-medium text-zinc-100">${server.name}</h3>
                                        <p class="text-sm text-zinc-400">${server.memberCount} members</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-amber-400 font-medium">+${server.reward} coins</span>
                                        <a href="${server.inviteUrl}" target="_blank" class="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded transition duration-200">
                                            Join
                                        </a>
                                    </div>
                                </div>
                            `;
                            j4rServersList.appendChild(serverElement);
                        });
                    } else {
                        j4rServersList.innerHTML = `
                            <div class="flex justify-center items-center h-24 text-zinc-500">
                                No servers available at the moment.
                            </div>
                        `;
                    }
                } else {
                    j4rServersList.innerHTML = `
                        <div class="flex justify-center items-center h-24 text-zinc-500">
                            ${data.error || 'Failed to load servers.'}
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading J4R servers:', error);
                j4rServersList.innerHTML = `
                    <div class="flex justify-center items-center h-24 text-zinc-500">
                        Failed to load servers. Please try again later.
                    </div>
                `;
            });
    }

    function loadTransactionHistory() {
        if (!transactionHistory) return;

        fetch('/api/economy/transactions')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.transactions && data.transactions.length > 0) {
                        transactionHistory.innerHTML = '';
                        
                        data.transactions.forEach(transaction => {
                            const date = new Date(transaction.timestamp);
                            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                            
                            const transactionElement = document.createElement('div');
                            transactionElement.className = 'bg-zinc-800/50 rounded-lg p-3';
                            transactionElement.innerHTML = `
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-zinc-200">${transaction.description}</p>
                                        <p class="text-xs text-zinc-400">${formattedDate}</p>
                                    </div>
                                    <span class="${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'} font-medium">
                                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount} coins
                                    </span>
                                </div>
                            `;
                            transactionHistory.appendChild(transactionElement);
                        });
                    } else {
                        transactionHistory.innerHTML = `
                            <div class="flex justify-center items-center h-24 text-zinc-500">
                                No transactions yet.
                            </div>
                        `;
                    }
                } else {
                    transactionHistory.innerHTML = `
                        <div class="flex justify-center items-center h-24 text-zinc-500">
                            ${data.error || 'Failed to load transactions.'}
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading transactions:', error);
                transactionHistory.innerHTML = `
                    <div class="flex justify-center items-center h-24 text-zinc-500">
                        Failed to load transactions. Please try again later.
                    </div>
                `;
            });
    }

    function setupLinkGeneration(buttonId, endpoint, title) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.addEventListener('click', () => {
            fetch(`/api/economy/generate-link/${endpoint}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        modalTitle.textContent = title;
                        generatedLink.textContent = data.url;
                        openLinkBtn.href = data.url;
                        showModal('link-modal');
                    } else {
                        alert(data.error || `Failed to generate ${title} link.`);
                    }
                })
                .catch(error => {
                    console.error(`Error generating ${title} link:`, error);
                    alert(`Failed to generate ${title} link. Please try again later.`);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadJ4RServers();
        loadTransactionHistory();
        
        setupLinkGeneration('generate-linkpays', 'linkpays', 'Linkpays');
        setupLinkGeneration('generate-shareus', 'shareus', 'ShareUS');
        setupLinkGeneration('generate-linkvertise', 'linkvertise', 'Linkvertise');
    });
})()