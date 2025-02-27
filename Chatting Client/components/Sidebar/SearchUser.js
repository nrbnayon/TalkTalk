'use client';
import { useState, useEffect, useRef } from 'react';
import { UserSearch, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SearchResults from './SearchResults';
import useDebounce from '@/hooks/useDebounce';
import { useDynamicTypesQuery } from '@/redux/features/dynamicType/dynamicTypeApiSlice';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SearchUser({ showSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [error, setError] = useState(null);
  const searchbarRef = useRef(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch all users if no search results using the dynamic API
  const { data: allUsers, isLoading: allUsersLoading } = useDynamicTypesQuery({
    dynamicApi: 'users',
    searchParams: {},
  });

  useEffect(() => {
    const searchbar = searchbarRef.current;

    if (showSearch) {
      searchbar?.focus();
    } else {
      searchbar?.blur();
    }

    return () => searchbar?.blur();
  }, [showSearch]);

  // Effect for handling the debounced search term
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm) {
        setIsLoading(false);
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setSearchedOnce(true);
      setError(null);

      try {
        console.log('Searching for:', debouncedSearchTerm);
        const response = await fetch(
          `/api/alluser?searchTerm=${encodeURIComponent(debouncedSearchTerm)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Server responded with ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          setResults(data.data || []);
        } else {
          setError(data.message || 'Search failed');
          setResults([]);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setError(error.message || 'Failed to search users');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  // Use all users if search returned no results
  useEffect(() => {
    if (
      searchedOnce &&
      results.length === 0 &&
      !isLoading &&
      !error &&
      allUsers?.data?.length > 0
    ) {
      setResults(allUsers.data);
    }
  }, [searchedOnce, results.length, isLoading, allUsers, error]);

  const handleSearchTerm = e => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query) {
      setSearchedOnce(false);
      setResults([]);
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="flex items-center px-4 py-2">
        <div className="relative w-full">
          <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchbarRef}
            type="search"
            className="w-full pl-10 bg-gray-50"
            placeholder="Search users to connect"
            value={searchTerm}
            onChange={handleSearchTerm}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(searchTerm || results.length > 0) && !error && (
        <SearchResults
          results={results}
          isLoading={isLoading || allUsersLoading}
          searchTerm={searchTerm}
          setResults={setResults}
          setSearchTerm={setSearchTerm}
        />
      )}
    </div>
  );
}
