'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Shared, responsive search input for every role. No global input selectors required. */
export function SearchField({ value, onChange, placeholder = 'Cari data...', label = 'Cari data', className = '', style }: SearchFieldProps) {
  const id = React.useId();
  return (
    <div className={`lentera-search-field ${className}`} style={{
      display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box',
      width: '100%', minWidth: 0, height: 48, padding: '0 12px',
      borderRadius: 14, border: '1px solid #cedee8', background: '#fff',
      color: '#17324d', ...style,
    }}>
      <Search size={18} color="#52748b" aria-hidden="true" style={{ flexShrink: 0 }} />
      <label htmlFor={id} style={{ position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>{label}</label>
      <input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
        style={{ appearance: 'none', flex: '1 1 auto', width: '100%', minWidth: 0, height: 44, minHeight: 44,
          border: 'none', outline: 'none', background: 'transparent', boxShadow: 'none', padding: 0, margin: 0,
          fontSize: 14, lineHeight: '20px', color: '#17324d' }} />
      {value.length > 0 && <button type="button" onClick={() => onChange('')} aria-label={`Hapus ${label.toLowerCase()}`}
        style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, flexShrink: 0, border: 0,
          borderRadius: 8, background: '#eaf4f6', color: '#315b72', cursor: 'pointer' }}>
        <X size={16} aria-hidden="true" />
      </button>}
    </div>
  );
}
