import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#006A67",
          dark: "#004B49",
          light: "#D9F3EF"
        },
        secondary: {
          main: "#D97706",
          dark: "#92400E",
          light: "#FEF3C7"
        },
        background: {
          default: "#F6FAF8",
          paper: "#FFFFFF"
        },
        text: {
          primary: "#10201D",
          secondary: "#66736F"
        },
        divider: "rgba(16, 32, 29, 0.1)",
        success: {
          main: "#0F9F6E"
        },
        error: {
          main: "#DC2626"
        }
      }
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: [
      "Inter",
      "Roboto",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif"
    ].join(","),
    h4: {
      fontWeight: 800,
      letterSpacing: 0
    },
    h5: {
      fontWeight: 800,
      letterSpacing: 0
    },
    h6: {
      fontWeight: 750,
      letterSpacing: 0
    },
    button: {
      fontWeight: 700,
      textTransform: "none"
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "linear-gradient(180deg, #ECF8F4 0%, #F6FAF8 38%, #F9FBFA 100%)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(16, 32, 29, 0.1)",
          boxShadow: "0 12px 28px rgba(16, 32, 29, 0.08)"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          letterSpacing: 0
        }
      }
    }
  }
});

export default theme;
