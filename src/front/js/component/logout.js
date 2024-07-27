import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token'); // Remove token from local storage
        navigate('/'); // Redirect to home page or login page
    }, [navigate]);

    return <p>Logging out...</p>;
};

export default Logout;
