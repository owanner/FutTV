import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchOffIcon from "@mui/icons-material/SearchOff";

/** 404 page shown when no route matches. */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: 2,
        textAlign: "center",
        px: 2
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: "text.secondary" }} />
      <Typography variant="h5" fontWeight={700}>
        Página não encontrada
      </Typography>
      <Typography variant="body2" color="text.secondary">
        O endereço que você acessou não existe.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Voltar ao início
      </Button>
    </Box>
  );
}
