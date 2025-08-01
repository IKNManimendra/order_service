const express = require('express');
const router = express.Router();
const {
    getOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder,
} = require('../controllers/orderController');

router.get('/', getOrders);
router.get('/:id', getOneOrder);
router.post('/', addOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
