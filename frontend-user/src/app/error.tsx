'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("APP ERROR:", error);
  }, [error]);

  return (
    <div style={{ padding: '20px', color: 'red', backgroundColor: '#fee' }}>
      <h2>Something went wrong!</h2>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}
