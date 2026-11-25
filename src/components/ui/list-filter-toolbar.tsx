'use client';

import * as React from 'react';
import { Check, ChevronDown, Download, Funnel } from 'lucide-react';
import { SearchField } from '@/components/ui/search-field';

type FilterOption = { value: string; label: string };

interface ListFilterToolbarProps {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  status: string;
  onStatusChange: (value: string) => void;
  options: FilterOption[];
  count: number;
  total: number;
  onExport: () => void;
  exportLabel?: string;
}

const field: React.CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  minHeight: 48,
  height: 48,
  border: '1px solid #cddce8',
  borderRadius: 16,
  padding: '0 14px',
  background: '#fff',
  color: '#17324d',
};

const nativeControl: React.CSSProperties = {
  display: 'block',
  minWidth: 0,
  width: '100%',
  height: 42,
  minHeight: 42,
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  background: 'transparent',
  color: '#17324d',
  fontSize: 14,
  padding: 0,
  margin: 0,
};

const hiddenLabel: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

function FilterIllustration() {
  return (
    <span aria-hidden="true" style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
      <span
        style={{
          position: 'absolute',
          left: 5,
          top: 7,
          width: 24,
          height: 28,
          borderRadius: 10,
          background: 'linear-gradient(180deg, #bfe0fb 0%, #8ebce6 100%)',
          opacity: 0.75,
          boxShadow: '0 10px 20px -16px rgba(19,63,97,.35)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 9,
          top: 4,
          width: 24,
          height: 28,
          borderRadius: 10,
          background: '#fffaf0',
          border: '1px solid #dfe9f3',
          boxShadow: '0 10px 24px -18px rgba(19,63,97,.22)',
        }}
      >
        <span style={{ position: 'absolute', left: 5, top: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[0, 1, 2].map((index) => (
            <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={8} strokeWidth={3} color="#4bc0a9" />
              <span
                style={{
                  display: 'block',
                  width: index === 1 ? 10 : 11,
                  height: 2.5,
                  borderRadius: 999,
                  background: '#b8c8d6',
                }}
              />
            </span>
          ))}
        </span>
      </span>
      <span
        style={{
          position: 'absolute',
          right: -1,
          bottom: 1,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'linear-gradient(180deg, #7ddfc9 0%, #45bea6 100%)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 10px 18px -12px rgba(28,131,117,.55)',
          border: '2px solid #fff',
        }}
      >
        <Funnel size={10} strokeWidth={2.5} color="#ffffff" />
      </span>
      <span
        style={{
          position: 'absolute',
          left: 35,
          top: 2,
          display: 'flex',
          gap: 3,
          transform: 'rotate(-10deg)',
        }}
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{
              width: 4,
              height: index === 1 ? 10 : 8,
              borderRadius: 999,
              background: '#f2cd84',
              opacity: 0.95,
            }}
          />
        ))}
      </span>
    </span>
  );
}

export function ListFilterToolbar({
  title,
  query,
  onQueryChange,
  placeholder,
  status,
  onStatusChange,
  options,
  count,
  total,
  onExport,
  exportLabel = 'Ekspor CSV',
}: ListFilterToolbarProps) {
  const id = React.useId();

  return (
    <section
      className="lentera-list-toolbar"
      aria-label={title}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        padding: '18px 20px',
        border: '1px solid #dce9f1',
        borderRadius: 18,
        background: '#fff',
        boxShadow: '0 12px 28px -24px rgba(14,50,77,.28)',
        color: '#17324d',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.4, fontWeight: 750, color: '#17324d' }}>{title}</h2>
          <p style={{ margin: '3px 0 0', fontSize: 13, lineHeight: 1.5, color: '#526b7e' }}>
            Cari dan saring data yang ingin ditampilkan.
          </p>
        </div>
        <span
          aria-live="polite"
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            borderRadius: 999,
            padding: '6px 12px',
            background: '#e6f6f2',
            color: '#16655e',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {count} dari {total} data
        </span>
      </div>

      <div
        className="lentera-list-toolbar-row"
        style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, minWidth: 0 }}
      >
        <div className="lentera-list-toolbar-search" style={{ flex: '1 1 280px', minWidth: 0 }}>
          <SearchField value={query} onChange={onQueryChange} placeholder={placeholder} label={`Cari ${title}`} />
        </div>

        <div
          className="lentera-list-toolbar-filter"
          style={{
            ...field,
            flex: '0 1 250px',
            minWidth: 215,
            paddingLeft: 10,
            gap: 12,
          }}
        >
          <FilterIllustration />
          <label htmlFor={`${id}-status`} style={hiddenLabel}>Filter status</label>
          <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0 }}>
            <select
              id={`${id}-status`}
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              style={{
                ...nativeControl,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                paddingRight: 30,
                fontWeight: 650,
                color: '#17324d',
              }}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 2,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#234f76',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={count === 0}
          onClick={onExport}
          style={{
            boxSizing: 'border-box',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            height: 48,
            minHeight: 48,
            padding: '0 17px',
            borderRadius: 16,
            border: '1px solid #bbd8e5',
            background: count === 0 ? '#f5f7f9' : '#f5fbfd',
            color: '#173f5b',
            fontSize: 14,
            fontWeight: 650,
            whiteSpace: 'nowrap',
            cursor: count === 0 ? 'not-allowed' : 'pointer',
            opacity: count === 0 ? 0.55 : 1,
          }}
        >
          <Download size={17} aria-hidden="true" />
          {exportLabel}
        </button>
      </div>
    </section>
  );
}
