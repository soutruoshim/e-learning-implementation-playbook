'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
});

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current && chart) {
      const id = `mermaid-${Math.random().toString(36).substring(7)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      }).catch((e) => {
        console.error("Mermaid rendering error", e);
        setError(e.toString());
      });
    }
  }, [chart]);

  return (
    <div className="mermaid-container my-6">
      <div ref={ref} className="mermaid flex justify-center" />
      {error && (
        <pre className="text-red-500 bg-red-100 p-4 rounded-md text-sm mt-2">
          {error}
        </pre>
      )}
      {!ref.current?.innerHTML && !error && (
        <div className="animate-pulse bg-gray-100 h-32 rounded-md flex items-center justify-center">
          Loading diagram...
        </div>
      )}
    </div>
  );
}
