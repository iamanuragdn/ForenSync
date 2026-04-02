import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import './Search.css';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || ''; 
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        setResults(data); 

      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="search-page-container">
      <div className="search-header">
        <h2>Search Results for <span className="highlight">"{query}"</span></h2>
        <p>Found {results.length} results across syllabus, notes, and exams.</p>
      </div>

    {loading ? (
        <div className="results-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="result-card" style={{ cursor: 'default', transform: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <div className="result-card-header">
                <div className="skeleton-pulse skeleton-title"></div>
                <div className="skeleton-pulse skeleton-badge"></div>
              </div>
              <div className="skeleton-pulse skeleton-line"></div>
              <div className="skeleton-pulse skeleton-line short"></div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="results-grid">
          {results.map((item, index) => (
            <div 
              key={index} 
              className="result-card"
              onClick={() => navigate(item.link)}
            >
              <div className="result-card-header">
                <h3>{item.title}</h3>
                <span className={`result-badge badge-${item.type.toLowerCase()}`}>
                  {item.type}
                </span>
              </div>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-search-state">
          <span className="empty-icon"><SearchIcon size={48} /></span>
          <h3>No exact matches found</h3>
          <p>We couldn't find anything matching "{query}". Try checking your spelling or using more general terms.</p>
          <button className="btn-back" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default Search;