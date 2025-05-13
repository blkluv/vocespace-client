'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('页面发生错误:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          width: '48vw',
          gap: '24px',
          textAlign: 'left',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            width: '100%',
            fontWeight: '900',
            margin: '0',
            padding: '0',
          }}
        >
          {error?.code || 500} | Error!
        </h1>
        <div
          style={{
            width: '100%',
          }}
        >
          <p
            style={{
              width: '100%',
            }}
          >
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <p>
            {error?.description || 'Please try again later or contact support.'}
          </p>
        </div>
        <button
          style={{
            width: 'fit-content',
            padding: '8px 16px',
            backgroundColor: '#22CCEE',
            color: 'white',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={backHome}
        >
          Back
        </button>
      </div>
    </div>
  );
}
