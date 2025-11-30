import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, SlidersHorizontal, SortAsc, SortDesc } from 'lucide-react';

export interface SearchFilter {
  query: string;
  category?: string;
  level?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  duration?: string;
  sortBy?: 'relevance' | 'rating' | 'price' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilter) => void;
  categories?: string[];
  levels?: string[];
  showPriceFilter?: boolean;
  showRatingFilter?: boolean;
  showDurationFilter?: boolean;
  placeholder?: string;
  initialFilters?: Partial<SearchFilter>;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  categories = [],
  levels = ['Beginner', 'Intermediate', 'Advanced'],
  showPriceFilter = true,
  showRatingFilter = true,
  showDurationFilter = true,
  placeholder = 'Search courses...',
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<SearchFilter>({
    query: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
    ...initialFilters
  });
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });

  useEffect(() => {
    onSearch(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const cleared = {
      query: '',
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const
    };
    setFilters(cleared);
    setPriceRange({ min: 0, max: 500 });
    onSearch(cleared);
  };

  const hasActiveFilters = filters.category || filters.level || filters.rating || 
    filters.duration || (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 500));

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5" style={{ color: '#6F73D2' }} />
        </div>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-all"
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: 'white',
            color: '#0B1E3F'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#00B5AD';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center space-x-2">
          {filters.query && (
            <button
              onClick={() => handleFilterChange('query', '')}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" style={{ color: '#6F73D2' }} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-[#00B5AD] text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium" style={{ color: '#0B1E3F' }}>Filters:</span>
          {filters.category && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)', color: '#00B5AD' }}>
              <span>{filters.category}</span>
              <button onClick={() => handleFilterChange('category', undefined)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.level && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)', color: '#00B5AD' }}>
              <span>{filters.level}</span>
              <button onClick={() => handleFilterChange('level', undefined)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.rating && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)', color: '#00B5AD' }}>
              <span>{filters.rating}+ stars</span>
              <button onClick={() => handleFilterChange('rating', undefined)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.duration && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)', color: '#00B5AD' }}>
              <span>{filters.duration}</span>
              <button onClick={() => handleFilterChange('duration', undefined)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm font-medium hover:underline"
            style={{ color: '#00B5AD' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-6 rounded-lg border-2 space-y-6" style={{ borderColor: '#E5E7EB', backgroundColor: 'white' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-5 w-5" style={{ color: '#6F73D2' }} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Level
              </label>
              <select
                value={filters.level || ''}
                onChange={(e) => handleFilterChange('level', e.target.value || undefined)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: 'white',
                  color: '#0B1E3F'
                }}
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            {showPriceFilter && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Price Range
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={priceRange.min}
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || 0;
                        setPriceRange(prev => ({ ...prev, min }));
                        handleFilterChange('priceRange', { min, max: priceRange.max });
                      }}
                      className="w-full px-3 py-2 border-2 rounded-lg"
                      style={{ borderColor: '#E5E7EB' }}
                      placeholder="Min"
                    />
                    <span style={{ color: '#6F73D2' }}>to</span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={priceRange.max}
                      onChange={(e) => {
                        const max = parseInt(e.target.value) || 500;
                        setPriceRange(prev => ({ ...prev, max }));
                        handleFilterChange('priceRange', { min: priceRange.min, max });
                      }}
                      className="w-full px-3 py-2 border-2 rounded-lg"
                      style={{ borderColor: '#E5E7EB' }}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rating Filter */}
            {showRatingFilter && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Minimum Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F'
                  }}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            )}

            {/* Duration Filter */}
            {showDurationFilter && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                  Duration
                </label>
                <select
                  value={filters.duration || ''}
                  onChange={(e) => handleFilterChange('duration', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-all"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F'
                  }}
                >
                  <option value="">Any Duration</option>
                  <option value="short">Short (&lt; 2 hours)</option>
                  <option value="medium">Medium (2-10 hours)</option>
                  <option value="long">Long (10+ hours)</option>
                </select>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Sort By
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                  className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-all"
                  style={{
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#0B1E3F'
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="price">Price</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="h-5 w-5" style={{ color: '#00B5AD' }} />
                  ) : (
                    <SortDesc className="h-5 w-5" style={{ color: '#00B5AD' }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

