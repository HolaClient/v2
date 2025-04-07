module.exports = {
    getUserCoins: async (userId) => {
        const userCoins = db.get('economy', userId);
        return userCoins ? userCoins.coins : 0;
    },

    updateUserCoins: async (userId, coins) => {
        let economy = db.get("economy", userId);
        economy.coins = coins;
        db.set('economy', userId, economy);
    },

    addTransaction: async (userId, amount, description) => {
        const transaction = {
            id: hc.modules.uuid(),
            userId,
            amount,
            description,
            timestamp: Date.now()
        };
        
        db.set('economy_transactions', transaction.id, transaction);
        
        const userCoins = db.get('economy', userId);
        const currentCoins = userCoins ? userCoins.coins : 0;
        let economy = db.get("economy", userId);
        economy.coins = currentCoins + amount;
        db.set('economy', userId, economy);
        
        return transaction;
    },

    isEconomyEnabled: () => {
        return hc.settings.raw('economy.general.enabled') === true;
    },

    isFeatureEnabled: (feature) => {
        return hc.settings.raw(`economy.${feature}.enabled`) === true;
    }
};
