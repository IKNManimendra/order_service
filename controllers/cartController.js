const cartService = require('../services/cartService');

const addToCart = async (req, res) => {
    console.log('Add to Cart payload from controller before try:', req.body);
    try {
        const { user_id, game_id, quantity } = req.body;
        if (!user_id || !game_id || !quantity) {
            return res.status(400).json({ error: 'user_id, game_id, and quantity are required' });
        }

        console.log('Add to Cart payload from controller:', req.body);

        const updatedItem = await cartService.addToCart({ user_id, game_id, quantity });

        res.status(200).json(updatedItem.rows[0]);
    } catch (err) {
        console.error('Error adding to cart:', err.message);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
};

const getCart = async (req, res) => {
    try {
        const user_id = req.params.user_id;
        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const cartItems = await cartService.getCartByUser(user_id);
        res.status(200).json(cartItems);
    } catch (err) {
        console.error('Error getting cart:', err.message);
        res.status(500).json({ error: 'Failed to get cart' });
    }
};

const clearCart = async (req, res) => {
    try {
        const user_id = req.params.user_id;
        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        await cartService.clearCart(user_id);
        res.status(200).json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Error clearing cart:', err.message);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};

module.exports = {
    addToCart,
    getCart,
    clearCart,
};
