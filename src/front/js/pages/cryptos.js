import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function CryptoApp() {
  const [cryptoData, setCryptoData] = useState([]);
  const [orderBy, setOrderBy] = useState('market_cap_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      setLoading(true);
      const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
      const params = {
        vs_currency: 'usd',
        order: orderBy,
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
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      try {
        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setFavorites(new Set(data));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchCryptoData();
    fetchFavorites();
  }, [orderBy]);

  const handleOrderByChange = (event) => {
    setOrderBy(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const toggleFavorite = async (cryptoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    setFavorites(prevFavorites => {
      //const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(cryptoId)) {
        newFavorites.delete(cryptoId);
      } else {
        newFavorites.add(cryptoId);
      }

      fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ favorites: Array.from(newFavorites) })
      }).catch(error => {
        console.error('Error updating favorites:', error);
      });

      return newFavorites;
    });
  };

  const filteredCryptoData = cryptoData.filter(crypto =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCryptoData = [...filteredCryptoData].sort((a, b) => {
    if (orderBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (orderBy === 'market_cap_asc') {
      return a.market_cap - b.market_cap;
    } else if (orderBy === 'market_cap_desc') {
      return b.market_cap - a.market_cap;
    } else if (orderBy === 'price_asc') {
      return a.current_price - b.current_price;
    } else if (orderBy === 'price_desc') {
      return b.current_price - a.current_price;
    }
    return 0;
  });

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
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1 className="my-4 text-center title-animation">Crypto Prices</h1>
          <div className="form-group">
            <label htmlFor="orderBy">Order By:</label>
            <select
              id="orderBy"
              className="form-control"
              value={orderBy}
              onChange={handleOrderByChange}
            >
              <option value="market_cap_desc">Market Cap (Descending)</option>
              <option value="market_cap_asc">Market Cap (Ascending)</option>
              <option value="price_desc">Price (Descending)</option>
              <option value="price_asc">Price (Ascending)</option>
              <option value="name">Name (Alphabetical)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              className="form-control"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="row">
          {sortedCryptoData.map(crypto => (
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
                  <p className="card-text">Price: ${crypto.current_price.toFixed(2)}</p>
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
                  <a
                    href={`https://www.coingecko.com/en/coins/${crypto.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mt-2"
                  >
                    View on CoinGecko
                  </a>
                  <button
                    className={`btn ${favorites.has(crypto.id) ? 'btn-danger' : 'btn-outline-danger'} mt-2 ms-2`}
                    onClick={() => toggleFavorite(crypto.id)}
                  >
                    {favorites.has(crypto.id) ? 'Unfavorite' : 'Favorite'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CryptoApp;
