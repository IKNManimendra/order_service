const cartService = require('../services/cartService');

// Get user's cart
const getCartItems = async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
        const items = await cartService.getCartItems(userId);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add to cart
const addItemToCart = async (req, res) => {
    const { user_id, game_id, quantity } = req.body;
    try {
        const item = await cartService.addToCart(user_id, game_id, quantity);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove item
const removeItemFromCart = async (req, res) => {
    const { user_id, game_id } = req.body;

    try {
        if (!user_id || !game_id) {
            return res.status(400).json({ error: 'user_id and game_id are required' });
        }

        await cartService.removeFromCart(user_id, game_id);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Clear cart
const clearCart = async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
        await cartService.clearCart(userId);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getCartItems,
    addItemToCart,
    removeItemFromCart,
    clearCart
};
