const orderService = require('../services/orderService');

const getOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.status(200).json(orders);
    } catch (err) {
        console.error('Error getting orders:', err.message);
        res.status(500).json({ error: 'Failed to get orders' });
    }
};

const getOneOrder = async (req, res) => {
    try {
        const order = await orderService.getOneOrder(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(order);
    } catch (err) {
        console.error(`Error getting order ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to get order' });
    }
};

const addOrder = async (req, res) => {
    try {
        // Your service addOrder expects user_id, so extract it accordingly
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const newOrder = await orderService.addOrder(user_id);
        res.status(201).json(newOrder);
    } catch (err) {
        console.error('Error adding order:', err.message);
        res.status(500).json({ error: 'Failed to add order' });
    }
};

const updateOrder = async (req, res) => {
    try {
        const updated = await orderService.updateOrder(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(updated);
    } catch (err) {
        console.error(`Error updating order ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to update order' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const deleted = await orderService.deleteOrder(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(deleted);
    } catch (err) {
        console.error(`Error deleting order ${req.params.id}:`, err.message);
        res.status(500).json({ error: 'Failed to delete order' });
    }
};

module.exports = {
    getOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder
};
