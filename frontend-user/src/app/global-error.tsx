'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fee' }}>
          <h2>Global Error!</h2>
          <pre>{error.message}</pre>
          <pre>{error.stack}</pre>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
