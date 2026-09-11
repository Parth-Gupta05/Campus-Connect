import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSearch, FiCheck, FiX, FiPlusCircle, FiBriefcase } from 'react-icons/fi';

export default function CompanySearchInput({ value, onChange, disabled }) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value && value.name) {
      setQuery(value.name);
    }
  }, [value?.name]);

  // In-memory cache to prevent duplicate queries for already searched terms
  const searchCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Debounced search with request cancellation and in-memory cache
  useEffect(() => {
    const trimmed = query.trim();

    // If query is empty or unchanged from selected company while dropdown closed, reset
    if (!trimmed || trimmed.length < 2 || (value && value.name === query && !isOpen)) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = searchCacheRef.current.get(trimmed.toLowerCase());
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await axios.get(`/placements/companies/search?q=${encodeURIComponent(trimmed)}`, {
          signal: abortControllerRef.current.signal
        });
        const results = res.data || [];
        // Cache result
        searchCacheRef.current.set(trimmed.toLowerCase(), results);
        setSuggestions(results);
      } catch (err) {
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
          // Ignore canceled requests
          return;
        }
        console.error('Error fetching company suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350); // 350ms debounce delay

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, isOpen, value?.name]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange({
      name: item.name,
      domain: item.domain || '',
      logoUrl: item.logoUrl || '',
      isCustom: false
    });
    setQuery(item.name);
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    if (!query.trim()) return;
    onChange({
      name: query.trim(),
      domain: '',
      logoUrl: '',
      isCustom: true
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({
      name: '',
      domain: '',
      logoUrl: '',
      isCustom: false
    });
    setQuery('');
    setSuggestions([]);
    setIsOpen(true);
  };

  // Helper placeholder avatar
  const renderFallbackLogo = (name) => {
    const initial = (name || 'C').charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
        {initial}
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {value && value.name && !isOpen ? (
        // Selected Company Card View
        <div className="flex items-center justify-between p-3 rounded-xl border border-border-light bg-surface-container-low shadow-sm transition-all">
          <div className="flex items-center gap-3">
            {value.logoUrl ? (
              <img
                src={value.logoUrl}
                alt={value.name}
                className="w-9 h-9 rounded-lg object-contain bg-surface-container-lowest p-1 border border-border-light shadow-sm flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: value.logoUrl ? 'none' : 'flex' }}>
              {renderFallbackLogo(value.name)}
            </div>
            <div>
              <div className="font-bold text-on-surface flex items-center gap-2">
                {value.name}
                {value.isCustom ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant">
                    Custom
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-600 flex items-center gap-0.5">
                    <FiCheck className="text-xs" /> Verified Brand
                  </span>
                )}
              </div>
              {value.domain && (
                <div className="text-xs text-on-surface-variant font-mono">{value.domain}</div>
              )}
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-surface-variant rounded-lg text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Change Company"
            >
              <FiX className="text-base" /> Change
            </button>
          )}
        </div>
      ) : (
        // Search Input & Autocomplete Dropdown
        <div>
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3.5 text-on-surface-variant text-base pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search company (e.g. Google, Microsoft, Atlassian)..."
              disabled={disabled}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-border-light bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium shadow-sm"
            />
            {loading && (
              <div className="absolute right-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
            {!loading && query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          {isOpen && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto custom-scrollbar divide-y divide-border-light/50 animate-in fade-in slide-in-from-top-1 duration-150">
              {suggestions.length > 0 && (
                <div className="p-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                    Suggested Companies
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-variant/80 transition-colors text-left group"
                    >
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-border-light shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ display: item.logoUrl ? 'none' : 'flex' }}>
                        {renderFallbackLogo(item.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </div>
                        {item.domain && (
                          <div className="text-xs text-on-surface-variant font-mono truncate">
                            {item.domain}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add Custom Company Option */}
              <div className="p-1.5 bg-surface-container-low/50">
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-variant transition-colors text-left text-on-surface"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-base flex-shrink-0">
                    <FiPlusCircle />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-on-surface truncate">
                      Use <span className="font-bold text-primary">"{query.trim()}"</span> as company name
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      Not in Logo.dev directory? Add it manually with an auto-generated logo
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
