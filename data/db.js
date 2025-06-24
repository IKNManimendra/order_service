const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lugx_db',
    password: 'isuri@123A',
    port: 5432,
});

module.exports = pool;
