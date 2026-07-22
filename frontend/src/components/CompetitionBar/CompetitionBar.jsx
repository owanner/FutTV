import { useState } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import { useCompetition } from "../../contexts/CompetitionContext";
import { getAllCompetitions } from "../../config/competitions";

export default function CompetitionBar() {
  const { competition, setCompetition } = useCompetition();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const allCompetitions = getAllCompetitions();

  const handleClick = (e) => {
    if (allCompetitions.length <= 1) return;
    setAnchorEl(e.currentTarget);
  };

  const handleSelect = (id) => {
    setCompetition(id);
    setAnchorEl(null);
  };

  const bg = `linear-gradient(90deg, ${competition.colors.primary} 0%, ${competition.colors.secondary} 50%, ${competition.colors.accent} 100%)`;

  return (
    <Box sx={{ position: "sticky", top: { xs: 52, md: 62 }, zIndex: 1299 }}>
      <Box
        sx={{
          height: { xs: 32, md: 42 },
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)"
        }}
      >
        <Box
          onClick={handleClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 2,
            py: 0.75,
            borderRadius: 99,
            cursor: allCompetitions.length > 1 ? "pointer" : "default",
            transition: "0.2s",
            "&:hover": allCompetitions.length > 1
              ? { backgroundColor: "rgba(255,255,255,0.15)" }
              : {}
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.0rem",
              letterSpacing: ".03em"
            }}
          >
            {competition.shortName || competition.name}
          </Typography>

          {allCompetitions.length > 1 && (
            <ExpandMoreIcon sx={{ color: "#fff" }} fontSize="small" />
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {allCompetitions.map((comp) => (
          <MenuItem
            key={comp.id}
            onClick={() => handleSelect(comp.id)}
            selected={comp.id === competition.id}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {comp.id === competition.id && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{comp.shortName || comp.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
