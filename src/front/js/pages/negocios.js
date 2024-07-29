import React, { useState, useEffect } from 'react';

function StockApp() {
  const [stocksData, setStocksData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('value_desc');
  const [symbols, setSymbols] = useState([
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'INTC',
    'CSCO', 'ORCL', 'IBM', 'BA', 'DIS', 'MCD', 'WMT', 'COST', 'KO', 'PEP',
    'UNH', 'HD', 'CVX', 'MRK', 'PFE', 'ABT', 'T', 'VZ', 'XOM', 'MA',
    'BABA', 'JD', 'WBA', 'UNP', 'LMT', 'UPS', 'HON', 'GS', 'BLK', 'JPM'
  ]);
  const apiKey = 'jAx6ilDAhAzTWMEXpXASBwbAQCDOGvpV';

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const allStocksData = await Promise.all(symbols.map(async (symbol) => {
          // Implementar un pequeño retraso para evitar superar el límite
          await new Promise(resolve => setTimeout(resolve, 1000)); // Retraso de 1 segundo

          try {
            const [quoteResponse, profileResponse] = await Promise.all([
              fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`),
              fetch(`https://financialmodelingprep.com/api/v3/company/profile/${symbol}?apikey=${apiKey}`)
            ]);

            if (quoteResponse.status === 429 || profileResponse.status === 429) {
              throw new Error('Too Many Requests');
            }

            if (!quoteResponse.ok || !profileResponse.ok) {
              throw new Error('Network response was not ok');
            }

            const quoteData = await quoteResponse.json();
            const profileData = await profileResponse.json();

            return {
              symbol: symbol,
              quoteData: quoteData[0],
              profileData: profileData.profile
            };
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null; // Retorna null si hay un error
          }
        }));

        // Filtrar los datos nulos
        setStocksData(allStocksData.filter(data => data !== null));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchStockData();
  }, [symbols]);

  const toggleFavorite = (symbol) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOrderByChange = (event) => {
    setOrderBy(event.target.value);
  };

  const filteredStocksData = stocksData.filter(({ profileData }) =>
    profileData.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStocksData = [...filteredStocksData].sort((a, b) => {
    if (orderBy === 'name') {
      return a.profileData.companyName.localeCompare(b.profileData.companyName);
    } else if (orderBy === 'value_asc') {
      return a.quoteData.price - b.quoteData.price;
    } else if (orderBy === 'value_desc') {
      return b.quoteData.price - a.quoteData.price;
    }
    return 0;
  });

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1 className="my-4 text-center title-animation">Stock Prices</h1>
          <div className="form-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              className="form-control"
              placeholder="Search by company name..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="form-group mt-3">
            <label htmlFor="orderBy">Order By:</label>
            <select
              id="orderBy"
              className="form-control"
              value={orderBy}
              onChange={handleOrderByChange}
            >
              <option value="value_desc">Value (Descending)</option>
              <option value="value_asc">Value (Ascending)</option>
              <option value="name">Name (Alphabetical)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="row">
        {sortedStocksData.length > 0 ? (
          sortedStocksData.map(({ symbol, quoteData, profileData }) => (
            <div key={symbol} className="col-md-4 mb-4">
              <div className="card">
                <img
                  src={profileData.image}
                  className="card-img-top"
                  alt={profileData.companyName}
                  style={{ width: '50px', height: '50px', margin: 'auto' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{profileData.companyName}</h5>
                  <p className="card-text">Price: ${quoteData.price}</p>
                  <p className="card-text">Change: ${quoteData.change}</p>
                  <a
                    href={profileData.website}
                    className="btn card-button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More Info
                  </a>
                  <button
                    className={`btn ${favorites.has(symbol) ? 'btn-danger' : 'btn-outline-danger'} mt-2`}
                    onClick={() => toggleFavorite(symbol)}
                  >
                    {favorites.has(symbol) ? 'Unfavorite' : 'Favorite'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockApp;
