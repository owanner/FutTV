import { Chip, Stack, TextField } from "@mui/material";
import { useCompetition } from "../../contexts/CompetitionContext";
import { getCompetition } from "../../config/competitions";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "live", label: "Ao vivo", accent: "#DC2626" },
  { value: "upcoming", label: "Próximos", accent: "#006A67" },
  { value: "finished", label: "Encerrados", accent: "#475569" }
];

export default function MatchesFilters({ search, setSearch, status, setStatus }) {
  const { competitionId } = useCompetition();
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Seleção";

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <TextField
        size="small"
        placeholder={`Buscar ${teamLabel}`}
        value={search}
        onChange={event => setSearch(event.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2
          }
        }}
      />
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {STATUS_OPTIONS.map(opt => (
          <Chip
            key={opt.value}
            label={opt.label}
            onClick={() => setStatus(opt.value)}
            variant={status === opt.value ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              ...(status === opt.value && opt.accent
                ? { bgcolor: opt.accent, color: "#fff", borderColor: opt.accent }
                : status === opt.value
                  ? { bgcolor: "primary.main", color: "#fff" }
                  : {}
              ),
              "&:hover": opt.accent
                ? { bgcolor: `${opt.accent}20` }
                : {}
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}
