const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://34.122.139.8';

describe('Order Service Integration Test', () => {

    test('should fetch orders with enriched game data inside items', async () => {
        const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);

        if (response.data.length === 0) {
            console.warn('⚠️ No orders found. Add some orders before testing.');
        } else {
            const order = response.data[0];

            expect(order).toHaveProperty('id');
            expect(order).toHaveProperty('user_id');
            expect(order).toHaveProperty('status');
            expect(order).toHaveProperty('items');
            expect(Array.isArray(order.items)).toBe(true);
            expect(order.items.length).toBeGreaterThan(0);

            const item = order.items[0];
            expect(item).toHaveProperty('game_id');
            expect(item).toHaveProperty('quantity');
            expect(item).toHaveProperty('price_each');
            expect(item).toHaveProperty('name');

            console.log(`✅ Order #${order.id} includes game "${item.name}" (${item.quantity}x @ ${item.price_each})`);
        }
    });

});
