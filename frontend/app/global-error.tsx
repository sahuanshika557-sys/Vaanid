'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-4 text-xl font-bold">Application Error</h2>
          <p className="text-muted-foreground mb-4 text-sm">{error.message}</p>
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
