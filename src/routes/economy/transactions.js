module.exports = async () => {
    const economyUtils = require('../../utils/economy');
    app.get('/api/economy/transactions', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            if (!economyUtils.isEconomyEnabled()) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }
            
            const userId = req.session.userinfo.id;
            let transactions = await hc.database.find('economy_transactions', { userId });
            
            transactions.sort((a, b) => b.timestamp - a.timestamp);
            
            return res.json({
                success: true,
                transactions: transactions || []
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to fetch transactions"));
        }
    });

    app.get('/api/economy/balance', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            if (!economyUtils.isEconomyEnabled()) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }
            
            const userId = req.session.userinfo.id;
            const balance = await economyUtils.getUserCoins(userId);
            
            return res.json({
                success: true,
                balance
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to fetch balance"));
        }
    });
}
