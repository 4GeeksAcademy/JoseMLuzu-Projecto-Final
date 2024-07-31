import React, { useState, useEffect } from 'react';

function StockApp() {
  const [stocksData, setStocksData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('value_desc');
  const [symbols, setSymbols] = useState([
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'INTC',
    'CSCO', 'ORCL', 'IBM', 'BA', 'DIS', 'MCD', 'WMT', 'COST', 'KO', 'PEP',
    'UNH', 'HD', 'CVX', 'MRK', 'PFE', 'ABT', 'T', 'VZ', 'XOM', 'MA'
  ]);

  const apiKey = 'cqkjfmhr01qjqssgembgcqkjfmhr01qjqssgemc0';

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const allStocksData = await Promise.all(symbols.map(async (symbol) => {
          await new Promise(resolve => setTimeout(resolve, 500)); // Retraso de 0.5 segundos

          try {
            const [quoteResponse, profileResponse] = await Promise.all([
              fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
              fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`)
            ]);

            const quoteData = await quoteResponse.json();
            const profileData = await profileResponse.json();

            if (!quoteData || !profileData) {
              console.error(`No data found for ${symbol}`);
              return null;
            }

            const stockData = {
              symbol: symbol,
              price: quoteData.c,
              change: quoteData.d,
              companyName: profileData.name,
              logo: profileData.logo
            };

            return stockData;
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
          }
        }));

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

  const filteredStocksData = stocksData.filter(({ companyName }) =>
    companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStocksData = [...filteredStocksData].sort((a, b) => {
    if (orderBy === 'name') {
      return a.companyName.localeCompare(b.companyName);
    } else if (orderBy === 'value_asc') {
      return a.price - b.price;
    } else if (orderBy === 'value_desc') {
      return b.price - a.price;
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
          sortedStocksData.map(({ symbol, price, change, companyName, logo }) => (
            <div key={symbol} className="col-md-4 mb-4">
              <div className="card">
                <img
                  src={logo}
                  className="card-img-top"
                  alt={companyName}
                  style={{ width: '50px', height: '50px', margin: 'auto' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{companyName}</h5>
                  <p className="card-text">Price: ${price}</p>
                  <p className="card-text">Change: ${change}</p>
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
