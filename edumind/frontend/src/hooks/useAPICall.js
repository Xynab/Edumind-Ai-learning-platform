import { useState, useCallback } from "react";

export function useAPICall() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const call = useCallback(async (apiFn, onSuccess) => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Something went wrong";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, call };
}
