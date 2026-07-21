import { Component } from "react";
import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";

/**
 * Catches JavaScript errors in the component tree and displays a fallback UI.
 * Wraps each route to prevent a single page error from crashing the entire app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
          <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h5" fontWeight={700}>
            Algo deu errado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ocorreu um erro inesperado. Tente novamente.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
          >
            Voltar ao início
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
