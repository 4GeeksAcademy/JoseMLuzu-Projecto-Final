import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_HOST = 'https://fantastic-robot-5ggj95pvqx9xhv64-3001.app.github.dev';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });
    const [totalSpent, setTotalSpent] = useState(0);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_HOST}/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                console.error('Error fetching categories:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await fetch(`${API_HOST}/items`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            if (response.ok) {
                const data = await response.json();
                setItems(data);
                calculateTotalSpent(data);
            } else {
                console.error('Error fetching items:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchItems();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (newCategory && !categories.some(cat => cat.name === newCategory)) {
            try {
                const payload = { name: newCategory, user_id: 1 }; // Ajusta user_id según sea necesario
                const response = await fetch(`${API_HOST}/categories`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const newCat = await response.json();
                    setCategories([...categories, newCat]);
                    setNewCategory('');
                } else {
                    console.error('Error adding category:', response.statusText);
                }
            } catch (error) {
                console.error('Error adding category:', error);
            }
        } else {
            console.error('Category is empty or already exists');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (newItem.name && newItem.price && newItem.category) {
            try {
                const category = categories.find(cat => cat.name === newItem.category);
                if (!category) {
                    console.error('Category not found');
                    return;
                }
                
                const response = await fetch(`${API_HOST}/items`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        name: newItem.name,
                        price: newItem.price,
                        category_id: category.id,
                        user_id: 1  // Ajusta user_id según sea necesario
                    })
                });
                if (response.ok) {
                    const newItemData = await response.json();
                    setItems([...items, newItemData]);
                    setNewItem({ name: '', price: '', category: '' });
                    calculateTotalSpent([...items, newItemData]);
                } else {
                    console.error('Error adding item:', response.statusText);
                }
            } catch (error) {
                console.error('Error adding item:', error);
            }
        } else {
            console.error('Please fill in all fields');
        }
    };

    const handleChangeItem = (e) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            const response = await fetch(`${API_HOST}/categories/${categoryId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            if (response.ok) {
                const updatedCategories = categories.filter(category => category.id !== categoryId);
                setCategories(updatedCategories);
                const updatedItems = items.filter(item => item.category_id !== categoryId);
                setItems(updatedItems);
                calculateTotalSpent(updatedItems);
            } else {
                console.error('Error deleting category:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            const response = await fetch(`${API_HOST}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            if (response.ok) {
                const updatedItems = items.filter(item => item.id !== itemId);
                setItems(updatedItems);
                calculateTotalSpent(updatedItems);
            } else {
                console.error('Error deleting item:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const calculateTotalSpent = (items) => {
        const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
        setTotalSpent(total);
    };

    const sortedItems = items.sort((a, b) => a.category.localeCompare(b.category));

    return (
        <div className="container">
            <h2>Category Manager</h2>
            
            <form onSubmit={handleAddCategory}>
                <div>
                    <label>New Category:</label>
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        required
                    />
                    <button type="submit">Add Category</button>
                </div>
            </form>

            <form onSubmit={handleAddItem}>
                <div>
                    <label>Item Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={newItem.name}
                        onChange={handleChangeItem}
                        required
                    />
                </div>
                <div>
                    <label>Item Price:</label>
                    <input
                        type="number"
                        name="price"
                        value={newItem.price}
                        onChange={handleChangeItem}
                        required
                    />
                </div>
                <div>
                    <label>Category:</label>
                    <select
                        name="category"
                        value={newItem.category}
                        onChange={handleChangeItem}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">Add Item</button>
            </form>

            <h3>Items</h3>
            {categories.map((category) => (
                <div key={category.id}>
                    <h4>
                        {category.name}
                        <button onClick={() => handleDeleteCategory(category.id)} style={{ marginLeft: '10px', color: 'red' }}>x</button>
                    </h4>
                    <ul>
                        {sortedItems
                            .filter((item) => item.category === category.name)
                            .map((item, index) => (
                                <li key={index}>
                                    {item.name} - ${item.price}
                                    <button onClick={() => handleDeleteItem(item.id)} style={{ marginLeft: '10px', color: 'red' }}>x</button>
                                </li>
                            ))}
                    </ul>
                </div>
            ))}

            <h3>Total Spent: ${totalSpent.toFixed(2)}</h3>
        </div>
    );
};

export default CategoryManager;
