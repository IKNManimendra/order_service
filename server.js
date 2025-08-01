
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Order Service API is running');
});
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});
