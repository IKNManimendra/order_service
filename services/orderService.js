const axios = require('axios');
const pool = require('../data/db');

const getAllOrders = async () => {
    const client = await pool.connect();

    try {
        const orderRes = await client.query('SELECT * FROM orders ORDER BY id ASC');
        const orders = orderRes.rows;

        const result = [];

        for (const order of orders) {
            // Get items for this order
            const itemsRes = await client.query(
                `SELECT game_id, quantity, price_each FROM order_items WHERE order_id = $1`,
                [order.id]
            );

            const items = itemsRes.rows;

            const detailedItems = [];

            for (const item of items) {
                try {
                    const gameRes = await axios.get(`http://localhost:3001/api/games/${item.game_id}`);
                    detailedItems.push({
                        ...item,
                        name: gameRes.data.name
                    });
                } catch (err) {
                    console.error(`Failed to fetch game details for game_id ${item.game_id}:`, err.message);
                    detailedItems.push({
                        ...item,
                        name: `Game #${item.game_id}`
                    });
                }
            }

            result.push({
                id: order.id,
                user_id: order.user_id,
                order_date: order.order_date,
                total_price: order.total_price,
                status: order.status,
                items: detailedItems
            });
        }

        return result;
    } finally {
        client.release();
    }
};


const getOneOrder = async (id) => {
    const client = await pool.connect();

    try {
        // 1. Get order header
        const orderRes = await client.query(
            `SELECT * FROM orders WHERE id = $1`,
            [id]
        );

        if (orderRes.rowCount === 0) return null;

        const order = orderRes.rows[0];

        // 2. Get order items
        const itemsRes = await client.query(
            `SELECT game_id, quantity, price_each FROM order_items WHERE order_id = $1`,
            [id]
        );

        const items = itemsRes.rows;

        // 3. Fetch game names from game-service
        const detailedItems = [];
        for (const item of items) {
            try {
                const gameRes = await axios.get(`http://localhost:3001/api/games/${item.game_id}`);
                detailedItems.push({
                    ...item,
                    name: gameRes.data.name
                });
            } catch (err) {
                console.error(`Failed to fetch game details for game_id ${item.game_id}:`, err.message);
                // If game-service is down or game is missing, fallback to ID only
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
            items: detailedItems
        };

    } finally {
        client.release();
    }
};


const addOrder = async ({ user_id, total_price, order_date, items }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Insert into orders
        const orderResult = await client.query(
            `
            INSERT INTO orders (user_id, total_price, order_date)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [user_id, total_price, order_date]
        );
        const orderId = orderResult.rows[0].id;

        // Step 2: For each item, get game price, insert into ordered_items
        for (const { game_id, quantity } of items) {
            const priceResult = await client.query(
                `SELECT price FROM games WHERE id = $1`,
                [game_id]
            );

            if (priceResult.rows.length === 0) {
                throw new Error(`Game with id ${game_id} not found`);
            }

            const priceEach = priceResult.rows[0].price;

            await client.query(
                `
                INSERT INTO order_items (order_id, game_id, quantity, price_each)
                VALUES ($1, $2, $3, $4)
                `,
                [orderId, game_id, quantity, priceEach]
            );
        }

        await client.query('COMMIT');
        return { id: orderId, user_id, total_price, order_date, items };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


const updateOrder = async (id, data) => {
    const client = await pool.connect();
    try {
        const { user_id, order_date, status, items } = data;

        await client.query('BEGIN');

        // Step 1: Delete old order_items
        await client.query(
            `DELETE FROM order_items WHERE order_id = $1`,
            [id]
        );

        // Step 2: Re-insert order_items with updated data
        let totalPrice = 0;

        for (const { game_id, quantity } of items) {
            const priceResult = await client.query(
                `SELECT price FROM games WHERE id = $1`,
                [game_id]
            );

            if (priceResult.rows.length === 0) {
                throw new Error(`Game with id ${game_id} not found`);
            }

            const priceEach = priceResult.rows[0].price;
            const lineTotal = quantity * priceEach;
            totalPrice += lineTotal;

            await client.query(
                `
                INSERT INTO order_items (order_id, game_id, quantity, price_each)
                VALUES ($1, $2, $3, $4)
                `,
                [id, game_id, quantity, priceEach]
            );
        }

        // Step 3: Update order metadata
        const orderUpdate = await client.query(
            `
            UPDATE orders
            SET user_id = $1,
                total_price = $2,
                order_date = $3,
            WHERE id = $5
            RETURNING *
            `,
            [user_id, totalPrice, order_date, id]
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


const deleteOrder = async (id) => {
    const result = await pool.query(
        'DELETE FROM orders WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
};

module.exports = {
    getAllOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder
};
