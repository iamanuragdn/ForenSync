import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from 'boneyard-js/react';
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

    <Skeleton name="search-results" loading={loading}>
      {results.length > 0 ? (
        <div className="categorized-search-page">
          {(() => {
            const subjects = results.filter(i => ['Subject', 'Topic', 'Program'].includes(i.type));
            const notes = results.filter(i => i.type === 'Notes');
            const pyqs = results.filter(i => i.type === 'PYQ');
            const practice = results.filter(i => i.type === 'Practice');

            const activeCategories = [
              { title: "Subjects & Syllabus", items: subjects },
              { title: "Notes & Materials", items: notes },
              { title: "PYQs (Past Papers)", items: pyqs },
              { title: "Mock Tests", items: practice }
            ].filter(cat => cat.items.length > 0);

            return activeCategories.map((cat, catIdx) => (
              <div key={catIdx} className="search-page-section">
                <h3 className="search-section-title">{cat.title}</h3>
                <div className="results-grid">
                  {cat.items.map((item, index) => (
                    <motion.div 
                      key={index} 
                      className="result-card"
                      onClick={() => navigate(item.link)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                    >
                      <div className="result-card-header">
                        <h3>{item.title}</h3>
                        <span className={`result-badge badge-${item.type.toLowerCase()}`}>
                          {item.type}
                        </span>
                      </div>
                      {item.breadcrumbs && (
                        <div className="result-breadcrumbs">
                          {item.breadcrumbs}
                        </div>
                      )}
                      <p>{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ));
          })()}
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
      </Skeleton>
    </div>
  );
}

export default Search;