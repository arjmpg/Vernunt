import React from 'react';

/**
 * Resilient lazy loader for React components.
 * Automatically recovers from chunk loading errors, network drops, or dev server restarts.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1200
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    const attempt = (remaining: number): Promise<{ default: T }> => {
      return factory().catch((error: any) => {
        const isModuleFetchError = 
          error?.message?.includes('dynamically imported module') ||
          error?.message?.includes('Failed to fetch') ||
          error?.name === 'ChunkLoadError';

        if (remaining > 0) {
          console.warn(`[LazyLoader] Dynamic import failed, retrying in ${interval}ms (${remaining} attempts left)...`, error);
          return new Promise(resolve => setTimeout(resolve, interval)).then(() => attempt(remaining - 1));
        }

        // If all retries failed and it's a module fetch / deployment invalidation error,
        // perform a one-time clean window reload so the client grabs the new asset manifest.
        if (typeof window !== 'undefined' && isModuleFetchError) {
          const reloadKey = 'vernunt_chunk_reload_' + window.location.pathname;
          const alreadyReloaded = sessionStorage.getItem(reloadKey);
          if (!alreadyReloaded) {
            sessionStorage.setItem(reloadKey, 'true');
            console.warn('[LazyLoader] Dynamic import failed after retries. Reloading page for updated asset manifest...');
            window.location.reload();
          }
        }

        throw error;
      });
    };

    return attempt(retries);
  });
}
