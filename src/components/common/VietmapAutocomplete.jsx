import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import axios from 'axios';

const VietmapAutocomplete = ({ value, onChange, placeholder = "Nhập địa chỉ của bạn...", className = "" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Đã chuyển phần gọi API sang Backend để bảo mật Key

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Gọi API Autocomplete thông qua Backend (để giấu API Key)
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/vietmap/autocomplete`, {
          params: { text: query }
        });

        // Backend trả về { success: true, data: [...] }
        if (response.data && response.data.success) {
          const resultData = response.data.data;
          if (Array.isArray(resultData)) {
            setSuggestions(resultData);
          } else if (resultData && Array.isArray(resultData.data)) {
            setSuggestions(resultData.data);
          } else {
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Lỗi khi gọi Vietmap API qua Backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Dùng Debounce để tránh gọi API liên tục khi gõ
    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = async (suggestion) => {
    // Thông thường field 'display' hoặc 'address' sẽ chứa đầy đủ địa chỉ
    const fullAddress = suggestion.display || suggestion.address || suggestion.name || '';
    setQuery(fullAddress);
    setSuggestions([]);
    setIsOpen(false);
    
    // Nếu có ref_id, gọi API place để lấy tọa độ
    let lat = null, lng = null;
    if (suggestion.ref_id) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/vietmap/place`, {
          params: { ref_id: suggestion.ref_id }
        });
        if (response.data && response.data.success) {
          const placeData = response.data.data;
          lat = placeData?.lat;
          lng = placeData?.lng;
        }
      } catch (error) {
        console.error('Lỗi lấy toạ độ Vietmap:', error);
      }
    }
    
    // Gửi giá trị về component cha, có thêm thông tin tọa độ
    onChange(fullAddress, lat, lng);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange(val); // Vẫn truyền giá trị đang gõ về cha
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if(suggestions.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
        )}
        {!isLoading && query && (
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-xl max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <li
              key={item.ref_id || index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-start gap-3 border-b border-border/50 last:border-0 transition-colors"
            >
              <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="font-semibold text-foreground text-sm">
                  {item.name || item.display?.split(',')[0]}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.display || item.address}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VietmapAutocomplete;
