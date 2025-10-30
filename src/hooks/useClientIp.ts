// src/hooks/useClientIp.ts
import { useEffect, useState } from "react";

export default function useClientIp() {
  const [ip, setIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setIp(data.ip);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to fetch IP");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { ip, loading, error };
}
