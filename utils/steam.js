async function getGameDetails(appId, currency = 'gb') {
    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${currency}&l=en`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Steam API error: ${response.statusText}`);
        
        const data = await response.json();
        
        if (!data[appId] || !data[appId].success) {
            return null; // Game not found or success: false
        }

        const gameData = data[appId].data;
        const isFree = gameData.is_free;
        let price = 0;
        let initial = 0;
        let discountPercent = 0;

        if (!isFree && gameData.price_overview) {
            price = gameData.price_overview.final / 100;
            initial = gameData.price_overview.initial / 100;
            discountPercent = gameData.price_overview.discount_percent;
        }

        return {
            name: gameData.name,
            price: price,
            initial: initial,
            currency: gameData.price_overview ? gameData.price_overview.currency : currency.toUpperCase(),
            discountPercent: discountPercent,
            isFree: isFree
        };
    } catch (error) {
        console.error(`Failed to fetch details for AppID ${appId}:`, error);
        return null;
    }
}

async function searchGame(query) {
    try {
        const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=en&cc=gb`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Steam API error: ${response.statusText}`);

        const data = await response.json();
        if (data.total > 0 && data.items.length > 0) {
            const item = data.items[0];
            let price = 0;
            if (item.price) {
                price = item.price.final / 100;
            }
            return {
                id: item.id,
                name: item.name,
                price: price,
                currency: 'GBP',
                url: `https://store.steampowered.com/app/${item.id}/`,
                store: 'Steam'
            };
        }
        return null;
    } catch (error) {
        console.error(`Failed to search for game '${query}':`, error);
        return null;
    }
}

module.exports = { getGameDetails, searchGame };
