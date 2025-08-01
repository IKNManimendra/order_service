const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');

// Add or update cart item
router.post('/', cartController.addToCart);

// Get all cart items for a user
router.get('/:user_id', cartController.getCart);

// Clear cart for a user
router.delete('/:user_id', cartController.clearCart);

module.exports = router;
