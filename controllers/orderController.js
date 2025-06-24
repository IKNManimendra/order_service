const orderService = require('../services/orderService');

const getAllOrders = async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
};

const getOneOrder = async (req, res) => {
    const order = await orderService.getOneOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(order);
};

const addOrder = async (req, res) => {
    const newOrder = await orderService.addOrder(req.body);
    res.status(201).json(newOrder);
};

const updateOrder = async (req, res) => {
    const updated = await orderService.updateOrder(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(updated);
};

const deleteOrder = async (req, res) => {
    const deleted = await orderService.deleteOrder(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json(deleted);
};

module.exports = {
    getAllOrders,
    getOneOrder,
    addOrder,
    updateOrder,
    deleteOrder
};
