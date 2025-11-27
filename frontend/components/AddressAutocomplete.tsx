'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './AddressAutocomplete.module.css';

interface AddressComponents {
  street_number: string;
  street_name: string;
  city: string;
  country: string;
  postal_code: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void;
}

export default function AddressAutocomplete({ onAddressSelect }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Create session token for the new API
    const token = new google.maps.places.AutocompleteSessionToken();
    setSessionToken(token);

    // Initialize autocomplete with new API
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
    });

    // Add listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.address_components) return;

      const addressComponents: AddressComponents = {
        street_number: '',
        street_name: '',
        city: '',
        country: '',
        postal_code: '',
      };

      // Parse address components
      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          addressComponents.street_number = component.long_name;
        }
        if (types.includes('route')) {
          addressComponents.street_name = component.long_name;
        }
        if (types.includes('locality')) {
          addressComponents.city = component.long_name;
        }
        if (types.includes('country')) {
          addressComponents.country = component.long_name;
        }
        if (types.includes('postal_code')) {
          addressComponents.postal_code = component.long_name;
        }
      });

      onAddressSelect(addressComponents);

      // Create new session token after selection
      setSessionToken(new google.maps.places.AutocompleteSessionToken());
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onAddressSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Start typing your address..."
      className={styles.autocompleteInput}
    />
  );
}
