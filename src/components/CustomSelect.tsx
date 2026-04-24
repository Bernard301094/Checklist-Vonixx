import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
  placeholder?: string;
  id?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  icon,
  placeholder = 'Selecionar...',
  id,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s2)',
          padding: `var(--s3) var(--s4)`,
          paddingLeft: icon ? 'calc(var(--s4) + 16px + var(--s2))' : 'var(--s4)',
          background: open ? 'var(--surface)' : 'var(--surface-2)',
          border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: open ? 'var(--r-lg) var(--r-lg) 0 0' : 'var(--r-lg)',
          color: selected ? 'var(--text)' : 'var(--text-faint)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: 'border-color 180ms, background 180ms, box-shadow 180ms',
          boxShadow: open ? '0 0 0 3px var(--primary-hl)' : 'none',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {/* Left icon */}
        {icon && (
          <span style={{
            position: 'absolute',
            left: 'var(--s4)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            {icon}
          </span>
        )}

        {/* Label */}
        <span style={{ flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'transform 180ms cubic-bezier(0.16,1,0.3,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--surface)',
            border: '1px solid var(--primary)',
            borderTop: '1px solid var(--divider)',
            borderRadius: '0 0 var(--r-lg) var(--r-lg)',
            boxShadow: 'var(--sh-lg)',
            overflow: 'hidden',
            animation: 'selectFadeIn 140ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s3)',
                  padding: 'var(--s3) var(--s4)',
                  background: isSelected ? 'var(--primary-hl)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isSelected ? 600 : 500,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid var(--divider)' : 'none',
                  textAlign: 'left',
                  transition: 'background 120ms, color 120ms',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                {/* Selected dot */}
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  flexShrink: 0,
                  transition: 'background 120ms',
                }} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes selectFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
