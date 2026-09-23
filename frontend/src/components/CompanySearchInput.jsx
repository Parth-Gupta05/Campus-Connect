import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Search, Check, X, PlusCircle, Building2, Loader2, Upload, Camera } from 'lucide-react';

export default function CompanySearchInput({ value, onChange, disabled }) {
  const { showToast } = useToast();
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

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
          return;
        }
        console.error('Error fetching company suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, isOpen, value?.name]);

  // Click outside to close & auto-commit typed query if not explicitly selected
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        const trimmed = query.trim();
        if (trimmed && (!value?.name || value.name !== trimmed)) {
          const exact = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
          if (exact) {
            onChange({
              name: exact.name,
              domain: exact.domain || '',
              logoUrl: exact.logoUrl || '',
              isCustom: false
            });
          } else {
            onChange({
              name: trimmed,
              domain: '',
              logoUrl: '',
              isCustom: true
            });
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, suggestions, value?.name]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        handleSelectCustom();
      }
    }
  };

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

  // Manual logo file upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be under 5MB', 'error');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data.url;
      onChange({
        name: value?.name || query.trim(),
        domain: value?.domain || '',
        logoUrl: uploadedUrl,
        isCustom: value?.isCustom !== undefined ? value.isCustom : true
      });

      showToast('Company logo uploaded successfully', 'success');
    } catch (err) {
      console.error('Error uploading logo:', err);
      showToast(err.response?.data?.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderFallbackLogo = (name) => {
    const initial = (name || 'C').charAt(0).toUpperCase();
    return (
      <span className="font-bold text-xs">{initial}</span>
    );
  };

  return (
    <div className="relative w-full font-sans" ref={dropdownRef}>
      {value && value.name && !isOpen ? (
        // Selected Company Card View (Clean, compact, no horizontal squeeze)
        <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-gray-400 bg-background-200 shadow-2xs transition-all">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Logo Container with upload overlay */}
            <div className="relative group/logo shrink-0">
              {value.logoUrl ? (
                <img
                  src={value.logoUrl}
                  alt={value.name}
                  className="w-10 h-10 rounded-lg object-contain bg-background-100 p-1 border border-gray-400 shadow-2xs shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{ display: value.logoUrl ? 'none' : 'flex' }}
                className="w-10 h-10 rounded-lg bg-background-100 border border-gray-400 text-gray-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
              >
                {renderFallbackLogo(value.name)}
              </div>

              {/* Upload/replace logo overlay on hover */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo || disabled}
                  title={value.logoUrl ? 'Replace custom logo' : 'Upload custom logo'}
                  className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
            </div>

            {/* Info details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-xs sm:text-sm text-gray-1000 truncate max-w-[130px]" title={value.name}>
                  {value.name}
                </span>
                {value.isCustom ? (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-background-100 text-gray-700 border border-gray-400 shrink-0">
                    Custom
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-600 font-mono">
                {value.domain ? (
                  <span className="truncate max-w-[95px] text-gray-500" title={value.domain}>
                    {value.domain}
                  </span>
                ) : null}

                {/* Upload or Change custom logo button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo || disabled}
                    className="text-[10px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-2.5 h-2.5" />
                        <span>{value.logoUrl ? 'Change logo' : 'Upload logo'}</span>
                      </>
                    )}
                  </button>
              </div>
            </div>
          </div>

          {/* Right Action: Change Company */}
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="h-7 px-2 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
              title="Change Company"
            >
              <X className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        // Search Input & Autocomplete Dropdown
        <div>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search company (e.g. Google, Microsoft, Atlassian)..."
              disabled={disabled}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-400 bg-background-200 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:bg-background-100 transition-all text-xs font-medium shadow-2xs"
            />
            {loading && (
              <div className="absolute right-3">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              </div>
            )}
            {!loading && query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 p-1 text-gray-500 hover:text-gray-1000 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isOpen && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-background-100 border border-gray-400 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto p-1 text-gray-1000 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-300 dark:divide-gray-800">
              {suggestions.length > 0 && (
                <div className="p-1">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    Suggested Companies
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left group cursor-pointer"
                    >
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="w-7 h-7 rounded-md object-contain bg-background-100 p-0.5 border border-gray-400 shadow-2xs shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ display: item.logoUrl ? 'none' : 'flex' }}>
                        <div className="w-7 h-7 rounded-md bg-background-100 border border-gray-400 text-gray-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {renderFallbackLogo(item.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-gray-1000 truncate">
                          {item.name}
                        </div>
                        {item.domain && (
                          <div className="text-[11px] text-gray-600 font-mono truncate">
                            {item.domain}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add Custom Company Options */}
              <div className="p-1 space-y-1">
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left text-gray-1000 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-background-200 border border-gray-400 text-gray-800 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-gray-1000 truncate">
                      Use <span className="font-semibold text-gray-1000">"{query.trim()}"</span> as company
                    </div>
                    <div className="text-[10px] text-gray-600 font-sans">
                      Add manually with fallback initial logo
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectCustom();
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left text-gray-1000 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-blue-600 dark:text-blue-400 truncate">
                      Use <span className="font-semibold">"{query.trim()}"</span> & upload custom logo
                    </div>
                    <div className="text-[10px] text-gray-600 font-sans">
                      Pick a PNG, JPG, or SVG logo file from your device
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for search mode custom logo upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
