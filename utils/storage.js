const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../wishlist.json');

function loadWishlist() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
        return [];
    }
    try {
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading wishlist.json:", err);
        return [];
    }
}

function saveWishlist(data) {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing to wishlist.json:", err);
    }
}

module.exports = { loadWishlist, saveWishlist };
