const express = require('express');
const router = express.Router();
const {
    getCartItems,
    addItemToCart,
    removeItemFromCart,
    clearCart
} = require('../controllers/cartController');

router.get('/:userId', getCartItems);
router.post('/', addItemToCart);
router.post('/remove', removeItemFromCart);
router.delete('/clear/:userId', clearCart);

module.exports = router;
