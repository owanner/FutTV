import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Navigation hook that preserves the current ?competition= search param.
 * Usage: const nav = useNav(); nav("/matches");
 */
export default function useNav() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useCallback(
    (to) => {
      const qs = searchParams.toString();
      navigate(qs ? `${to}?${qs}` : to);
    },
    [navigate, searchParams]
  );
}
