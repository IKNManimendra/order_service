
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});
