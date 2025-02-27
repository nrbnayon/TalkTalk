// Chatting Client\components\Sidebar\SearchUser.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { UserSearch } from 'lucide-react';
import SearchResults from './SearchResults';
import useDebounce from '@/hooks/useDebounce';

export default function SearchUser({ showSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchbarRef = useRef(null);

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
      }
    } catch (err) {
      console.log(err.response?.data?.message);
    }
  }, 700);

  const handleSearchTerm = e => {
    const query = e.target.value;
    setIsLoading(true);
    setSearchTerm(query);
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
            placeholder="search user to connect"
            required
            value={searchTerm}
            onChange={handleSearchTerm}
          />
        </label>
        {/* <button type="submit" className="btn btn-neutral join-item">
          <UserSearch size={18} />
        </button> */}
      </div>
      <SearchResults
        results={results}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setResults={setResults}
        setIsLoading={setIsLoading}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
}
