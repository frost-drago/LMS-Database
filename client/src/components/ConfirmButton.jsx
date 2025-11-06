import React from 'react';

export default function ConfirmButton({ children, confirm='Are you sure?', onClick, ...rest }) {
  return (
    <button
      onClick={() => {
        if (window.confirm(confirm)) onClick?.();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
