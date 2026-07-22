import { createContext, useContext, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getCompetition } from "../config/competitions";

const CompetitionContext = createContext(null);

/**
 * Provides competition state derived from URL param ?competition=.
 * Defaults to "wc2026" if not specified.
 */
export function CompetitionProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const competitionId = searchParams.get("competition") || "wc2026";
  const competition = getCompetition(competitionId);

  const setCompetition = useCallback(
    (id) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("competition", id);
        return next;
      });
    },
    [setSearchParams]
  );

  return (
    <CompetitionContext.Provider value={{ competition, competitionId, setCompetition }}>
      {children}
    </CompetitionContext.Provider>
  );
}

/**
 * Access the current competition, its id, and a setter.
 */
export function useCompetition() {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error("useCompetition must be used within CompetitionProvider");
  return ctx;
}
