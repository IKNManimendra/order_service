const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder,
} = require('../controllers/orderController');

router.get('/', getAllOrders);
router.get('/:id', getOneOrder);
router.post('/', addOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
