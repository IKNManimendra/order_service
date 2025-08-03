const axios = require('axios');
const pool = require('../data/db');
const cartService = require('./cartService');

const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || "http://lugx-game-service:30001";

// Get all orders with their items and game names
const getAllOrders = async () => {
    console.log('process.env.GAME_SERVICE_URL', process.env.GAME_SERVICE_URL);
    console.log('GAME_SERVICE_URL', GAME_SERVICE_URL);
    const client = await pool.connect();

    try {
        const orderRes = await client.query('SELECT * FROM orders ORDER BY id ASC');
        const orders = orderRes.rows;

        // Get all order_items in one query
        const itemRes = await client.query('SELECT * FROM order_items');
        const allItems = itemRes.rows;

        // Extract unique game_ids
        const gameIds = [...new Set(allItems.map(item => item.game_id))];

        // Fetch game details using bulk API
        let gameMap = {};
        try {
            console.log('Inside Fetching games in bulk:', GAME_SERVICE_URL);
            const response = await axios.get(`${GAME_SERVICE_URL}/api/games/bulk`, {
                params: { ids: gameIds.join(',') }
            });
            console.log('Fetched games in bulk:', response.data);

            const games = Array.isArray(response.data) ? response.data : response.data.games;
            console.log('Fetched games:', games);
            for (const game of games) {
                gameMap[game.id] = game.title;
            }
        } catch (err) {
            console.error('Failed to fetch games in bulk:', err.message);
        }

        // Group items by order_id
        const itemsByOrder = {};
        for (const item of allItems) {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push({
                game_id: item.game_id,
                quantity: item.quantity,
                price_each: item.price_each,
                name: gameMap[item.game_id] || `Game #${item.game_id}`
            });
        }

        // Assemble final order objects
        const result = orders.map(order => ({
            id: order.id,
            user_id: order.user_id,
            order_date: order.order_date,
            total_price: order.total_price,
            status: order.status,
            items: itemsByOrder[order.id] || []
        }));

        return result;

    } finally {
        client.release();
    }
};

// Get one order by ID, including detailed items
const getOneOrder = async (id) => {
    const client = await pool.connect();

    try {
        const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1`, [id]);
        if (orderRes.rowCount === 0) return null;
        const order = orderRes.rows[0];

        const itemsRes = await client.query(
            `SELECT game_id, quantity, price_each FROM order_items WHERE order_id = $1`,
            [id]
        );

        const items = itemsRes.rows;

        const detailedItems = [];
        for (const item of items) {
            try {
                const gameRes = await axios.get(`${GAME_SERVICE_URL}/api/games/${item.game_id}`);
                detailedItems.push({
                    ...item,
                    name: gameRes.data.name || gameRes.data.title || `Game #${item.game_id}`
                });
            } catch (err) {
                console.error(`Failed to fetch game details for game_id ${item.game_id}:`, err.message);
                detailedItems.push({
                    ...item,
                    name: `Game #${item.game_id}`
                });
            }
        }

        return {
            id: order.id,
            user_id: order.user_id,
            order_date: order.order_date,
            total_price: order.total_price,
            status: order.status,
            items: detailedItems
        };

    } finally {
        client.release();
    }
};

// Add order from cart for a user
const addOrder = async (user_id) => {
    console.log('Adding order for user:', user_id);
    const cartItems = await cartService.getCartByUser(user_id);
    if (!cartItems.length) throw new Error("Cart is empty");

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Use correct column names: total_amount and ordered_at
        const orderRes = await client.query(
            'INSERT INTO orders (user_id, total_amount, ordered_at, status) VALUES ($1, $2, NOW(), $3) RETURNING *',
            [user_id, total, 'pending']
        );

        const orderId = orderRes.rows[0].id;

        for (const item of cartItems) {
            await client.query(
                `INSERT INTO order_items (order_id, game_id, quantity, price_each)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, item.game_id, item.quantity, item.price]
            );
        }

        await cartService.clearCart(user_id);

        await client.query('COMMIT');

        return orderRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// Update an order
const updateOrder = async (id, data) => {
    const client = await pool.connect();
    try {
        const { user_id, order_date, status, items } = data;

        await client.query('BEGIN');
        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);

        let totalPrice = 0;
        for (const { game_id, quantity } of items) {
            const gameRes = await axios.get(`${GAME_SERVICE_URL}/api/games/${game_id}`);
            const priceEach = gameRes.data.price;
            totalPrice += priceEach * quantity;

            await client.query(
                `INSERT INTO order_items (order_id, game_id, quantity, price_each)
                 VALUES ($1, $2, $3, $4)`,
                [id, game_id, quantity, priceEach]
            );
        }

        const orderUpdate = await client.query(
            `UPDATE orders
             SET user_id = $1,
                 total_price = $2,
                 order_date = $3,
                 status = $4
             WHERE id = $5
             RETURNING *`,
            [user_id, totalPrice, order_date, status, id]
        );

        await client.query('COMMIT');

        return {
            ...orderUpdate.rows[0],
            items
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


// Delete order by ID
const deleteOrder = async (id) => {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
};

// Get orders by user
const getOrdersByUser = async (user_id) => {
    const client = await pool.connect();
    try {
        const orderRes = await client.query(
            `SELECT * FROM orders WHERE user_id = $1 ORDER BY ordered_at DESC`,
            [user_id]
        );
        const orders = orderRes.rows;

        const itemRes = await client.query(`SELECT * FROM order_items`);
        const items = itemRes.rows.filter(item => orders.some(o => o.id === item.order_id));

        const gameIds = [...new Set(items.map(item => item.game_id))];
        const gameMap = {};
        try {
            const response = await axios.get(`${GAME_SERVICE_URL}/api/games/bulk`, {
                params: { ids: gameIds.join(',') }
            });
            console.log('Fetched games in bulk for getOrdersByUser:', response.data);
            const games = response.data;
            for (const game of games) {
                gameMap[game.id] = game.title;
            }
        } catch (err) {
            console.error('Failed to fetch games in bulk:', err.message);
        }

        return orders.map(order => ({
            ...order,
            items: items
                .filter(item => item.order_id === order.id)
                .map(item => ({
                    game_id: item.game_id,
                    quantity: item.quantity,
                    price_each: item.price_each,
                    name: gameMap[item.game_id] || `Game #${item.game_id}`
                }))
        }));
    } finally {
        client.release();
    }
};


module.exports = {
    getAllOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrdersByUser
};
