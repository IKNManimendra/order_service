const pool = require('../data/db');
const axios = require('axios');
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || "http://lugx-game-service:30001";

// Correct: Add or update cart item
const addToCart = async ({ user_id, game_id, quantity }) => {
    console.log('AddToCart Service received:', { user_id, game_id, quantity });

    const result = await pool.query(
        `INSERT INTO cart_items (user_id, game_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, game_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
         RETURNING *`,
        [user_id, game_id, quantity]
    );
    return result;
};

const getCartByUser = async (user_id) => {
    console.log('GetCartByUser Service received:', { user_id });
    const result = await pool.query(
        `SELECT * FROM cart_items WHERE user_id = $1`,
        [user_id]
    );
    const items = result.rows;
    if (items.length === 0) return [];

    const gameIds = [...new Set(items.map(i => i.game_id))];

    let gameMap = {};
    try {
        const response = await axios.get(`${GAME_SERVICE_URL}/api/games/bulk`, {
            params: { ids: gameIds.join(',') }
        });
        console.log('Game data fetched successfully for getCartByUser:', response.data);
        for (const game of response.data) {
            gameMap[game.id] = { title: game.title, price: game.price };
        }
    } catch (err) {
        console.error("Failed to fetch game data for cart items:", err.message);
    }

    return items.map(item => ({
        ...item,
        title: gameMap[item.game_id]?.title || `Game #${item.game_id}`,
        price: gameMap[item.game_id]?.price || 0
    }));
};


const clearCart = async (user_id) => {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [user_id]);
};

module.exports = {
    addToCart,
    getCartByUser,
    clearCart,
};
