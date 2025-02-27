// Chatting Client\components\Sidebar\SearchResults.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { UserSearch } from 'lucide-react';
import SearchResults from './SearchResults';
import { useDynamicTypesQuery } from '@/redux/features/dynamicType/dynamicTypeApiSlice';
import useDebounce from '@/hooks/useDebounce';

export default function SearchUser({ showSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchbarRef = useRef(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  useEffect(() => {
    if (showSearch) {
      searchbarRef.current?.focus();
    } else {
      searchbarRef.current?.blur();
    }

    return () => searchbarRef.current?.blur();
  }, [showSearch]);

  const searchUser = useDebounce(async searchQuery => {
    try {
      const res = await axiosInstance.get(
        `/auth/search?searchTerm=${searchQuery}`
      );

      if (res?.data?.success) {
        setIsLoading(false);
        setResults(res?.data?.users);
        setSearchedOnce(true);
      }
    } catch (err) {
      console.log(err.response?.data?.message);
    }
  }, 700);

  // Fetch all users if no search results
  const { data: allUsers, isLoading: allUsersLoading } = useDynamicTypesQuery({
    dynamicApi: 'users',
  });

  useEffect(() => {
    if (searchedOnce && results.length === 0 && allUsers) {
      setResults(allUsers);
      setIsLoading(false);
    }
  }, [allUsers, searchedOnce, results.length]);

  const handleSearchTerm = e => {
    const query = e.target.value;
    setIsLoading(true);
    setSearchTerm(query);
    setSearchedOnce(false);

    if (query?.length > 0) {
      searchUser(query);
    } else {
      setIsLoading(false);
      setResults([]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="join w-full rounded flex justify-center my-4">
        <label className="input rounded focus:border-none outline-0 focus:outline-0 focus-within:outline-0">
          <UserSearch />
          <input
            ref={searchbarRef}
            type="search"
            className="focus:outline-0"
            placeholder="Search user to connect"
            required
            value={searchTerm}
            onChange={handleSearchTerm}
          />
        </label>
      </div>
      <SearchResults
        results={results}
        isLoading={isLoading || allUsersLoading}
        searchTerm={searchTerm}
        setResults={setResults}
        setIsLoading={setIsLoading}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
}
