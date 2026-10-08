import React, { useState, useEffect, useRef } from 'react';
import { collectionApi } from '../api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createPortal } from 'react-dom';

const CATEGORIES = [
    { id: 1, slug: 'movie', label: 'Фильмы' },
    { id: 2, slug: 'tv', label: 'Сериалы' },
    { id: 3, slug: 'anime', label: 'Аниме' }
];

const SearchBar = ({ collectionId, onAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [category, setCategory] = useState(1);

    const searchBarRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const currentCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const controller = new AbortController();

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await collectionApi.searchMediaItem(query, category, collectionId, controller.signal);
                setResults(data);
                setShowDropdown(true);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("Search error:", error);
                }
            } finally {
                setIsSearching(false);
            }
        }, 1500);

        return () => {
            clearTimeout(delayDebounceFn);
            controller.abort();
        };
    }, [query, category, collectionId]);

    useEffect(() => {
        if (showDropdown && searchBarRef.current) {
            const rect = searchBarRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: `${rect.bottom + window.scrollY + 8}px`,
                left: `${rect.left + window.scrollX}px`,
                width: `${rect.width}px`,
                zIndex: 9999,
            });
        }
    }, [showDropdown, results, query]);

    useEffect(() => {
        const handleGlobalClick = () => {
            setShowDropdown(false);
            setIsCategoryOpen(false);
        };
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    const handleAdd = async (item) => {
        try {
            await collectionApi.addMediaItemToCollection(
                item.simkl_id,
                currentCategory.slug,
                collectionId,
            );
            setResults(prev => prev.map(r =>
                r.simkl_id === item.simkl_id ? { ...r, already_in_collection: true } : r
            ));
            if (onAdded) onAdded();
        } catch (error) {
            console.error("Ошибка при добавлении:", error);
        }
    };

    return (
        <div ref={searchBarRef} className="relative w-full max-w-2xl mx-auto py-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center w-full h-12 rounded-lg border border-border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring">
                <div className="h-full relative flex items-center shrink-0 w-32">
                    <button
                        type="button"
                        onClick={() => {
                            setIsCategoryOpen(prev => !prev);
                            setShowDropdown(false);
                        }}
                        className="h-full w-full px-4 text-sm font-medium text-foreground/80 bg-transparent hover:bg-accent/40 focus:outline-none flex items-center justify-center transition-colors border-none rounded-l-lg select-none"
                    >
                        <span>{currentCategory.label}</span>
                    </button>
                    {isCategoryOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full border border-border bg-background p-1 rounded-lg shadow-md z-50 flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setCategory(cat.id);
                                        setIsCategoryOpen(false);
                                    }}
                                    className={`w-full text-left text-sm py-2 px-3 rounded-md transition-colors cursor-pointer focus:outline-none ${
                                        cat.id === category
                                            ? 'bg-accent text-accent-foreground font-medium'
                                            : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="h-full w-[1px] bg-border/60 shrink-0"></div>
                <div className="flex-grow h-full relative flex items-center">
                    <input
                        type="text"
                        className="w-full h-full border-none shadow-none rounded-r-lg pl-4 pr-10 text-sm bg-transparent focus:outline-none focus:ring-0"
                        placeholder={`Ищем ${currentCategory.label.toLowerCase()}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (results.length > 0) setShowDropdown(true);
                            setIsCategoryOpen(false);
                        }}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {isSearching && (
                            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        )}
                    </div>
                </div>
            </div>
            {showDropdown && results.length > 0 && createPortal(
                <div
                    style={dropdownStyle}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background border border-border rounded-lg shadow-lg max-h-[460px] overflow-y-auto p-1.5 space-y-0.5"
                >
                    {results.map((item) => (
                        <div
                            key={item.simkl_id}
                            className="flex items-center justify-between p-3 rounded-md hover:bg-accent/20 transition-colors group"
                        >
                            <div className="flex flex-col space-y-1 min-w-0 pr-4">
                                <span className="text-sm font-medium text-foreground truncate">
                                    {item.title}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {item.year} • {currentCategory.slug.toUpperCase()}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={item.already_in_collection}
                                onClick={() => !item.already_in_collection && handleAdd(item)}
                                className={`h-8 text-xs font-medium px-3 shrink-0 rounded-md transition-colors ${
                                    item.already_in_collection
                                        ? 'bg-secondary text-secondary-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                            >
                                {item.already_in_collection ? 'Добавлено' : 'Добавить'}
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};


export default SearchBar;