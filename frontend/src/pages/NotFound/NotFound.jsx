import { Box, Typography, Button } from "@mui/material";
import { SearchOff } from "@mui/icons-material";
import { useNav } from "../../hooks/useNav";

export default function NotFound() {
  const navigate = useNav();

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
      <SearchOff sx={{ fontSize: 64, color: "text.secondary" }} />
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
