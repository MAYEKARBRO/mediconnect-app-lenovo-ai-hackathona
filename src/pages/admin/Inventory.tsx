import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { Box, AlertTriangle, Search, ShoppingCart, Clock } from 'lucide-react';

interface InventoryItem {
    id: string;
    item_name: string;
    category: string;
    quantity: number;
    unit: string;
    min_threshold: number;
    usage_per_day?: number; // Estimated usage to calculate remaining days
}

interface CartItem extends InventoryItem {
    orderQty: number;
}

const CATEGORIES = ['Medicine', 'Equipment', 'Consumables', 'Stationery', 'Other'];

const HARDCODED_INVENTORY: InventoryItem[] = [
    { id: '101', item_name: 'Paracetamol 500mg', category: 'Medicine', quantity: 5000, unit: 'pills', min_threshold: 1000, usage_per_day: 200 },
    { id: '102', item_name: 'Amoxicillin 500mg', category: 'Medicine', quantity: 1200, unit: 'pills', min_threshold: 500, usage_per_day: 50 },
    { id: '103', item_name: 'Insulin Glargine', category: 'Medicine', quantity: 45, unit: 'vials', min_threshold: 20, usage_per_day: 2 },
    { id: '104', item_name: 'Disposable Syringes 5ml', category: 'Consumables', quantity: 800, unit: 'pcs', min_threshold: 200, usage_per_day: 40 },
    { id: '105', item_name: 'Surgical Gloves (size M)', category: 'Consumables', quantity: 150, unit: 'pairs', min_threshold: 300, usage_per_day: 60 },
    { id: '106', item_name: 'N95 Masks', category: 'Consumables', quantity: 1200, unit: 'pcs', min_threshold: 500, usage_per_day: 100 },
    { id: '107', item_name: 'IV Sets', category: 'Consumables', quantity: 300, unit: 'sets', min_threshold: 100, usage_per_day: 15 },
    { id: '108', item_name: 'Betadine 500ml', category: 'Consumables', quantity: 30, unit: 'bottles', min_threshold: 10, usage_per_day: 1 },
    { id: '109', item_name: 'Cotton Rolls 500g', category: 'Consumables', quantity: 40, unit: 'rolls', min_threshold: 15, usage_per_day: 2 },
    { id: '110', item_name: 'Digital BP Monitor', category: 'Equipment', quantity: 12, unit: 'units', min_threshold: 5, usage_per_day: 0 },
    { id: '111', item_name: 'Pulse Oximeter', category: 'Equipment', quantity: 25, unit: 'units', min_threshold: 10, usage_per_day: 0 },
];

const Inventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Cart Logic
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('*').order('item_name');
        if (data && data.length > 0) {
            setItems(data.map(i => ({ ...i, usage_per_day: i.usage_per_day || 10 }))); // Default usage if DB missing
        } else {
            setItems(HARDCODED_INVENTORY);
        }
    };

    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === item.id);
            if (existing) {
                return prev.map(c => c.id === item.id ? { ...c, orderQty: c.orderQty + 10 } : c);
            }
            return [...prev, { ...item, orderQty: 50 }]; // Default initial order quantity
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const updateCartQty = (id: string, qty: number) => {
        if (qty < 1) return;
        setCart(prev => prev.map(c => c.id === id ? { ...c, orderQty: qty } : c));
    };

    const calculateDaysRemaining = (qty: number, usage: number) => {
        if (!usage || usage <= 0) return 999; // Indefinite
        return Math.floor(qty / usage);
    };

    const filteredItems = items.filter(item =>
        (categoryFilter === 'All' || item.category === categoryFilter) &&
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* LEFT COLUMN: Inventory List (2/3 width) */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex flex-shrink-0 justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Current Inventory</h1>
                    <div className="text-sm text-gray-500">{items.length} Items Listed</div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search inventory..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['All', ...CATEGORIES].map(cat => (
                            <Button
                                key={cat}
                                variant={categoryFilter === cat ? 'primary' : 'outline'}
                                onClick={() => setCategoryFilter(cat)}
                                size="sm"
                                className="whitespace-nowrap"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Inventory Grid Scrollable */}
                <div className="flex-1 overflow-y-auto pr-2 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {filteredItems.map(item => {
                        const daysLeft = calculateDaysRemaining(item.quantity, item.usage_per_day || 0);
                        const isCritical = daysLeft < 7 || item.quantity <= item.min_threshold;

                        return (
                            <Card key={item.id} className={`border-l-4 shadow-sm ${isCritical ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500'}`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{item.category}</span>
                                            <h3 className="font-bold text-gray-900 leading-tight">{item.item_name}</h3>
                                        </div>
                                        {isCritical && (
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between mt-3">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {item.quantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-medium mt-1">
                                                <Clock className={`h-3 w-3 ${isCritical ? 'text-red-600' : 'text-green-600'}`} />
                                                <span className={isCritical ? 'text-red-600' : 'text-green-600'}>
                                                    {daysLeft > 365 ? '> 1 Year' : daysLeft + ' Days'} left
                                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => addToCart(item)} className="h-8">
                                            + Add to List
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT COLUMN: Restock Cart (1/3 width) */}
            <div className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-white border rounded-lg shadow-sm h-full">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    <h2 className="font-bold text-gray-900">Restock List</h2>
                    <span className="ml-auto bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">
                        {cart.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            <Box className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Your order list is empty.</p>
                            <p className="text-xs mt-1">Add items from the inventory to create a restock order.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-start border-b pb-3 last:border-0 relative group">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm text-gray-900">{item.item_name}</h4>
                                    <p className="text-xs text-gray-500">Current: {item.quantity} {item.unit}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={item.orderQty}
                                        onChange={e => updateCartQty(item.id, parseInt(e.target.value) || 0)}
                                        className="w-16 h-8 text-right px-1"
                                    />
                                    <span className="text-xs text-gray-400">{item.unit}</span>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-gray-400 hover:text-red-500 absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1"
                                >
                                    &times;
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between text-sm mb-4 text-gray-600">
                        <span>Total Items:</span>
                        <span className="font-bold text-gray-900">{cart.length}</span>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={cart.length === 0} onClick={() => alert('Order placed successfully! (Mock)')}>
                        Place Restock Order
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
