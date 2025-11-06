import React from 'react';

export default function FormField({ label, value, onChange, type='text', ...rest }) {
  return (
    <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
        {...rest}
      />
    </label>
  );
}
