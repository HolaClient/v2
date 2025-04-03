document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('market-modal');
    const modalContent = document.getElementById('modal-content');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTransactionBtn = document.getElementById('cancel-transaction');
    const confirmTransactionBtn = document.getElementById('confirm-transaction');
    const quantityInput = document.getElementById('resource-quantity');
    const increaseQuantityBtn = document.getElementById('increase-quantity');
    const decreaseQuantityBtn = document.getElementById('decrease-quantity');
    const unitPriceElement = document.getElementById('unit-price');
    const summaryQuantityElement = document.getElementById('summary-quantity');
    const totalPriceElement = document.getElementById('total-price');
    
    let marketPrices = {};
    try {
        const marketPriceData = document.getElementById('market-price');
        if (marketPriceData) {
            marketPrices = JSON.parse(marketPriceData.textContent);
            console.log('Market prices loaded:', marketPrices);
        }
    } catch (error) {
        console.error('Failed to parse market prices:', error);
    }
    
    let currentTransaction = {
        resource: '',
        action: '',
        price: 0,
        quantity: 1
    };
    
    const resourceNames = {
        memory: 'Memory',
        disk: 'Storage',
        cpu: 'CPU Threads',
        subdomains: 'Subdomains',
        allocations: 'Allocations',
        backups: 'Backups',
        databases: 'Databases'
    };
    
    const resourceUnits = {
        memory: 'GB',
        disk: 'GB',
        cpu: 'Cores',
        subdomains: '',
        allocations: 'Ports',
        backups: 'Slots',
        databases: ''
    };
    
    const marketButtons = document.querySelectorAll('.market-btn');
    
    marketButtons.forEach(button => {
        button.addEventListener('click', () => {
            const resource = button.getAttribute('data-resource');
            const action = button.getAttribute('data-action');
            const price = parseFloat(button.getAttribute('data-price'));
            
            openTransactionModal(resource, action, price);
        });
    });
    
    function openTransactionModal(resource, action, price) {
        currentTransaction = {
            resource,
            action,
            price,
            quantity: 1
        };
        
        const actionText = action === 'buy' ? 'Buy' : 'Sell';
        modalTitle.textContent = `${actionText} ${resourceNames[resource]}`;
        
        if (action === 'buy') {
            confirmTransactionBtn.className = 'px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-emerald-800/20';
            confirmTransactionBtn.textContent = 'Buy Now';
        } else {
            confirmTransactionBtn.className = 'px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-rose-800/20';
            confirmTransactionBtn.textContent = 'Sell Now';
        }
        
        quantityInput.value = 1;
        
        updatePriceInfo();
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    
    function closeTransactionModal() {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    function updatePriceInfo() {
        const quantity = parseInt(quantityInput.value);
        const total = (currentTransaction.price * quantity).toFixed(2);
        
        unitPriceElement.textContent = `${currentTransaction.price.toFixed(2)}`;
        summaryQuantityElement.textContent = `${quantity} ${resourceUnits[currentTransaction.resource] || ''}`;
        totalPriceElement.textContent = `${total}`;
        
        currentTransaction.quantity = quantity;
    }
    
    closeModalBtn.addEventListener('click', closeTransactionModal);
    cancelTransactionBtn.addEventListener('click', closeTransactionModal);
    modalBackdrop.addEventListener('click', closeTransactionModal);
    
    modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    increaseQuantityBtn.addEventListener('click', () => {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updatePriceInfo();
    });
    
    decreaseQuantityBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updatePriceInfo();
        }
    });
    
    quantityInput.addEventListener('input', () => {
        if (parseInt(quantityInput.value) < 1 || !quantityInput.value) {
            quantityInput.value = 1;
        }
        updatePriceInfo();
    });
    
    confirmTransactionBtn.addEventListener('click', async () => {
        const { resource, action, price, quantity } = currentTransaction;
        const total = (price * quantity).toFixed(2);
        
        confirmTransactionBtn.disabled = true;
        confirmTransactionBtn.textContent = action === 'buy' ? 'Buying...' : 'Selling...';
        
        try {
            const response = await fetch('/api/market/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resource,
                    action,
                    price,
                    quantity
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                const message = `Successfully ${action === 'buy' ? 'purchased' : 'sold'} ${quantity} ${resourceNames[resource]} for $${total}`;
                alert(message);
                closeTransactionModal();
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                alert(`Transaction failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Transaction error:', error);
            alert(`Transaction failed: Network error`);
        } finally {
            confirmTransactionBtn.disabled = false;
            confirmTransactionBtn.textContent = action === 'buy' ? 'Buy Now' : 'Sell Now';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeTransactionModal();
        }
    });
});