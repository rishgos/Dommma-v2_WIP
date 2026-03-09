import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

/**
 * PostalCodeAutocomplete - Google Places powered postal code input
 * 
 * @param {string} value - Current input value
 * @param {function} onChange - Called with the postal code string
 * @param {function} onDetectLocation - Called when user clicks detect location
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes for the input
 * @param {boolean} detectingLocation - Whether location detection is in progress
 * @param {string} country - Restrict to country code (default: 'ca')
 */
const PostalCodeAutocomplete = ({ 
  value, 
  onChange, 
  onDetectLocation,
  placeholder = "Postal code",
  className = "",
  detectingLocation = false,
  country = 'ca'
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Google Places Autocomplete for postal codes
  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        return false;
      }

      if (autocompleteRef.current) return true;

      try {
        // Use 'regions' type to get postal codes and areas
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(regions)'],
          componentRestrictions: { country },
          fields: ['address_components', 'formatted_address']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place.address_components) {
            // Find postal code component
            const postalComponent = place.address_components.find(c => 
              c.types.includes('postal_code')
            );
            
            if (postalComponent) {
              onChange(postalComponent.short_name.toUpperCase());
            } else {
              // Try to extract from formatted address for Canadian postal codes
              const match = place.formatted_address?.match(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/i);
              if (match) {
                onChange(match[0].toUpperCase().replace(/\s/g, ' '));
              }
            }
          }
        });

        setIsReady(true);
        return true;
      } catch (error) {
        console.error('Failed to initialize postal code autocomplete:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (initAutocomplete()) return;

    // If Google Maps not loaded yet, wait for it
    const checkInterval = setInterval(() => {
      if (initAutocomplete()) {
        clearInterval(checkInterval);
      }
    }, 100);

    // Clean up
    return () => {
      clearInterval(checkInterval);
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [country, onChange]);

  const handleInputChange = (e) => {
    // Uppercase and format postal code
    const val = e.target.value.toUpperCase();
    onChange(val);
  };

  return (
    <div className="flex items-center bg-white relative">
      <button 
        type="button"
        onClick={onDetectLocation}
        disabled={detectingLocation}
        className="ml-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        title="Use my location"
      >
        {detectingLocation ? (
          <Loader2 size={18} className="text-gray-400 animate-spin" />
        ) : (
          <Navigation size={18} className="text-gray-400 hover:text-[#1A2F3A]" />
        )}
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-28 md:w-36 px-2 py-4 text-gray-800 text-lg border-none outline-none uppercase bg-transparent ${className}`}
        data-testid="postcode-input"
        autoComplete="off"
      />
    </div>
  );
};

export default PostalCodeAutocomplete;
