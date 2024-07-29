import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return null; // Don't render the Navbar if no token is present
    }

    return (
        <nav>
            <ul>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link to="/profile">Profile</Link>
                </li>
                <li>
                    <Link to="/settings">Settings</Link>
                </li>
                <li>
                    <Link to="/cryptos">Cryptos</Link>
                </li>
                <li>
                    <Link to="/servicios">Services</Link>
                </li>
                <li>
                    <Link to="/stocks">Stock</Link>
                </li>
                <li>
                    <Link to="/logout">Logout</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
