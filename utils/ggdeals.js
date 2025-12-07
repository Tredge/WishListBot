const { GG_DEALS_KEY } = process.env;

async function getGamePrices(appIds) {
    if (!GG_DEALS_KEY) {
        console.error('GG_DEALS_KEY is missing in .env');
        return null;
    }

    // Ensure appIds is an array
    const idsArray = Array.isArray(appIds) ? appIds : [appIds];
    
    // API limit is 100 IDs per request
    if (idsArray.length > 100) {
        console.warn('GG.deals API limit is 100 IDs per request. Truncating list.');
        idsArray.length = 100;
    }

    const ids = idsArray.join(',');
    const url = `https://api.gg.deals/v1/prices/by-steam-app-id/?ids=${ids}&key=${GG_DEALS_KEY}&region=gb`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`GG.deals API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.success && data.data) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching from GG.deals:', error);
        return null;
    }
}

module.exports = { getGamePrices };
