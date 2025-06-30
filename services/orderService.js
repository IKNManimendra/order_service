const pool = require('../data/db');

const getAllOrders = async () => {
    const result = await pool.query('SELECT * FROM orders ORDER BY id ASC');
    return result.rows;
};

const getOneOrder = async (id) => {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0];
};

const addOrder = async ({ game_id, user_id, quantity, total_price, order_date }) => {
    const result = await pool.query(
        `
      INSERT INTO orders (game_id, user_id, quantity, total_price, order_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
        [game_id, user_id, quantity, total_price, order_date]
    );
    return result.rows[0];
};

const updateOrder = async (id, data) => {
    const { game_id, user_id, quantity, total_price, order_date } = data;
    const result = await pool.query(
        `
      UPDATE orders
      SET game_id = $1, user_id = $2, quantity = $3, total_price = $4, order_date = $5
      WHERE id = $6
      RETURNING *
    `,
        [game_id, user_id, quantity, total_price, order_date, id]
    );
    return result.rows[0];
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
