module.exports = {
    getUserCoins: async (userId) => {
        const userCoins = await hc.database.get('user_coins', userId);
        return userCoins ? userCoins.coins : 0;
    },

    updateUserCoins: async (userId, coins) => {
        await hc.database.set('user_coins', userId, { coins });
    },

    addTransaction: async (userId, amount, description) => {
        const transaction = {
            id: hc.modules.uuid(),
            userId,
            amount,
            description,
            timestamp: Date.now()
        };
        
        await hc.database.set('economy_transactions', transaction.id, transaction);
        
        const userCoins = await hc.database.get('user_coins', userId);
        const currentCoins = userCoins ? userCoins.coins : 0;
        await hc.database.set('user_coins', userId, { coins: currentCoins + amount });
        
        return transaction;
    },

    isEconomyEnabled: () => {
        return hc.settings.raw('economy.general.enabled') === true;
    },

    isFeatureEnabled: (feature) => {
        return hc.settings.raw(`economy.${feature}.enabled`) === true;
    }
};
