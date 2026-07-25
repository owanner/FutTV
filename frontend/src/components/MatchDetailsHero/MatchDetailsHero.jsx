import MatchCard from "../MatchCard/MatchCard";

/**
 * Hero card for the Match Details page.
 *
 * Renders the shared MatchCard in `hero` variant (large dark gradient,
 * crests centered with team names below). Kept as a thin wrapper so that
 * MatchDetails.jsx keeps its existing import path while all the visual
 * styling lives in the unified MatchCard component.
 */
export default function MatchDetailsHero({ match, colors }) {
  if (!match) return null;
  return <MatchCard match={match} variant="hero" colors={colors} noAction />;
}
