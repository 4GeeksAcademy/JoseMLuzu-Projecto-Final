import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const Dashboard = () => {
    const [favorites, setFavorites] = useState([]);
    const [cryptoData, setCryptoData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Obtener favoritos desde la API
        const fetchFavorites = async () => {
            try {
                const response = await fetch('https://fantastic-robot-5ggj95pvqx9xhv64-3001.app.github.dev/api/favorites', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Incluye el token aquí
                    }
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setFavorites(data.map(fav => fav.crypto_id));
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        };

        // Obtener datos de criptomonedas desde la API
        const fetchCryptoData = async () => {
            const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
            const params = {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 60,
                page: 1,
                sparkline: true
            };

            try {
                const response = await fetch(`${apiUrl}?${new URLSearchParams(params)}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCryptoData(data);
            } catch (error) {
                console.error('Error fetching crypto data:', error);
            }
        };

        fetchFavorites();
        fetchCryptoData();
    }, [navigate]);

    // Filtrar las criptomonedas favoritas
    const favoriteCryptoData = cryptoData.filter(crypto => favorites.includes(crypto.id));

    const generateSparklineData = (sparkline) => ({
        labels: sparkline.map((_, index) => index),
        datasets: [{
            data: sparkline,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            pointRadius: 0,
        }]
    });

    return (
        <div>
            <h1>Dashboard</h1>
            <div className="container">
                <div className="row">
                    {favoriteCryptoData.map(crypto => (
                        <div key={crypto.id} className="col-md-4 mb-4">
                            <div className="card">
                                <img
                                    src={crypto.image}
                                    className="card-img-top"
                                    alt={crypto.name}
                                    style={{ width: '50px', height: '50px', margin: 'auto' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{crypto.name}</h5>
                                    <p className="card-text">Price: ${crypto.current_price}</p>
                                    {crypto.sparkline_in_7d && (
                                        <div style={{ height: '50px' }}>
                                            <Line
                                                data={generateSparklineData(crypto.sparkline_in_7d.price)}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        x: { display: false },
                                                        y: { display: false },
                                                    },
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: { enabled: false },
                                                    },
                                                    elements: { line: { tension: 0.1 } }
                                                }}
                                                height={50}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
