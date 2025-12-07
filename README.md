# Steam Wishlist Bot

A Discord bot that tracks Steam game prices and notifies you of deals using the GG.deals API.

## Features

*   **Track Games**: Add games to a server-wide wishlist using Steam AppIDs, Store URLs, or by searching for the game name.
*   **Price Monitoring**: Automatically checks for price changes and deals every 30 minutes (configurable).
*   **Deal Alerts**: Get notified when a game on your wishlist is on sale.
*   **Price Comparison**: Uses GG.deals to find the best prices across multiple stores.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js**: [Download and install Node.js](https://nodejs.org/) (LTS version recommended).
2.  **Discord Bot Token**: Create a bot application on the [Discord Developer Portal](https://discord.com/developers/applications).
3.  **GG.deals API Key**: You will need an API key from [GG.deals](https://gg.deals/).

## Installation

1.  **Clone the repository** (or download the ZIP):
    ```bash
    git clone https://github.com/Tredge/wishlistbot.git
    cd "WishList Bot"
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    *   Change the `.env` variables to your own
    
    *   `DISCORD_TOKEN`: Your bot's token.
    *   `WISHLIST_CHANNEL_ID`: The ID of the channel where you want deal notifications to be posted.
    *   `CHECK_INTERVAL_MINUTES`: How often (in minutes) the bot checks for new prices.
    *   `STEAM_REGION`: Your preferred region code (e.g., `gb`, `us`, `eu`).
    *   `GG_DEALS_KEY`: Your API key from GG.deals.

## Running the Bot

Start the bot using:

```bash
npm start
```

Or manually:

```bash
node index.js
```

## Commands

The default prefix is `!`.

*   `!addwish <Game Name | AppID | URL>` - Add a game to the wishlist.
    *   *Example:* `!addwish Cyberpunk 2077` or `!addwish 1091500`
*   `!removewish <Game Name | AppID>` - Remove a game from the wishlist.
*   `!listwish` - Display the current wishlist with best prices.
*   `!finddeal <Game Name>` - Search for a specific game's current best deal without adding it to the wishlist.
*   `!clearwish` - Remove all games from the wishlist.
*   `!ping` - Check if the bot is online and responsive.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
