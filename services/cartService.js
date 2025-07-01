const pool = require('../data/db');
const axios = require('axios');

const getCartItems = async (userId) => {
    const result = await pool.query(
        `SELECT game_id, quantity FROM cart_items WHERE user_id = $1`,
        [userId]
    );

    const rawItems = result.rows;
    const detailedItems = [];

    for (const item of rawItems) {
        try {
            const gameRes = await axios.get(`http://localhost:3001/api/games/${item.game_id}`);
            const game = gameRes.data;
            const priceString = game.price;
            const formattedPrice = parseFloat(priceString.replace('$', ''));

            detailedItems.push({
                game_id: item.game_id,
                quantity: item.quantity,
                name: game.name,
                price: game.price,
                total: `$` + formattedPrice * item.quantity
            });
        } catch (err) {
            console.error(`Game ${item.game_id} fetch failed: ${err.message}`);
            detailedItems.push({
                game_id: item.game_id,
                quantity: item.quantity,
                name: `Game #${item.game_id}`,
                price: null,
                total: null
            });
        }
    }
    return detailedItems;
};


const addToCart = async (user_id, game_id, quantity) => {
    const existing = await pool.query(
        `SELECT * FROM cart_items WHERE user_id = $1 AND game_id = $2`,
        [user_id, game_id]
    );

    if (existing.rowCount > 0) {
        const updated = await pool.query(
            `UPDATE cart_items
             SET quantity = quantity + $1
             WHERE user_id = $2 AND game_id = $3
             RETURNING *`,
            [quantity, user_id, game_id]
        );
        return updated.rows[0];
    }

    const inserted = await pool.query(
        `INSERT INTO cart_items (user_id, game_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, game_id, quantity]
    );
    return inserted.rows[0];
};

const removeFromCart = async (user_id, game_id) => {
    await pool.query(
        `DELETE FROM cart_items WHERE user_id = $1 AND game_id = $2`,
        [user_id, game_id]
    );
};

const clearCart = async (userId) => {
    await pool.query(
        `DELETE FROM cart_items WHERE user_id = $1`,
        [userId]
    );
};

module.exports = {
    getCartItems,
    addToCart,
    removeFromCart,
    clearCart
};
