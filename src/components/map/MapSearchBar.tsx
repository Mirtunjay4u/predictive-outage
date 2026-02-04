import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Zap, Cable, Box, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Asset } from '@/types/asset';
import type { FeederZone } from '@/types/feederZone';

export interface SearchResult {
  type: 'feeder_zone' | 'asset';
  id: string;
  label: string;
  sublabel: string;
  assetType?: Asset['asset_type'];
  lat?: number;
  lng?: number;
  feederId?: string;
}

interface MapSearchBarProps {
  assets: Asset[];
  feederZones: FeederZone[];
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
}

export function MapSearchBar({ assets, feederZones, onSelect, onClear }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Search feeder zones
    feederZones.forEach(zone => {
      if (
        zone.feeder_id.toLowerCase().includes(q) ||
        zone.feeder_name.toLowerCase().includes(q)
      ) {
        // Calculate center of polygon for zooming
        const coords = zone.geo_area.type === 'Polygon' 
          ? (zone.geo_area.coordinates as number[][][])[0]
          : (zone.geo_area.coordinates as number[][][][])[0][0];
        
        const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;

        matches.push({
          type: 'feeder_zone',
          id: zone.id,
          label: zone.feeder_name,
          sublabel: zone.feeder_id,
          feederId: zone.feeder_id,
          lat: avgLat,
          lng: avgLng,
        });
      }
    });

    // Search assets
    assets.forEach(asset => {
      const searchFields = [
        asset.name,
        asset.feeder_id,
        asset.transformer_id,
        asset.fault_id,
      ].filter(Boolean).map(f => f!.toLowerCase());

      if (searchFields.some(f => f.includes(q))) {
        matches.push({
          type: 'asset',
          id: asset.id,
          label: asset.name,
          sublabel: asset.asset_type + (asset.feeder_id ? ` • ${asset.feeder_id}` : ''),
          assetType: asset.asset_type,
          lat: asset.lat,
          lng: asset.lng,
        });
      }
    });

    return matches.slice(0, 10); // Limit to 10 results
  }, [query, assets, feederZones]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.label);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onClear();
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === 'feeder_zone') {
      return <Cable className="w-4 h-4 text-primary" />;
    }
    switch (result.assetType) {
      case 'Fault': return <Zap className="w-4 h-4 text-destructive" />;
      case 'Feeder': return <Cable className="w-4 h-4 text-primary" />;
      case 'Transformer': return <Box className="w-4 h-4 text-warning" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search Feeder / Transformer / Fault…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 h-9 text-sm bg-card/95 backdrop-blur-sm border-border"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden z-[1000]">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No results found
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="py-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                      index === selectedIndex 
                        ? 'bg-primary/10' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {getIcon(result)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.sublabel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
