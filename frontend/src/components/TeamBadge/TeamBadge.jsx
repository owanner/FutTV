import {
  Box,
  Stack,
  Typography
} from "@mui/material";

import {
  useNavigate
} from "react-router-dom";

export default function TeamBadge({
  name,
  flag,
  code,

  clickable = true,

  flagWidth = 72,
  flagHeight = 48,

  containerWidth = 120,

  variant = "default" // default | hero | compact
}) {

  const navigate =
    useNavigate();

  const handleClick = () => {

    if (!clickable || !code) {
      return;
    }

    navigate(`/team/${code}`);
  };

  const isHero =
    variant === "hero";

  const isCompact =
    variant === "compact";

  return (

    <Stack
      alignItems="center"
      spacing={1}
      onClick={handleClick}
      sx={{
        width: containerWidth,

        cursor:
          clickable && code
            ? "pointer"
            : "default",

        userSelect: "none"
      }}
    >

      {/* Flag */}

      {isHero ? (

        <Box
          sx={{
            width: {
              xs: 64,
              sm: 82
            },

            height: {
              xs: 48,
              sm: 60
            },

            display: "grid",
            placeItems: "center",

            borderRadius: 2,

            backgroundColor:
              "rgba(255,255,255,.74)",

            border:
              "1px solid rgba(255,255,255,.72)",

            boxShadow:
              "0 10px 20px rgba(0,74,72,.12)"
          }}
        >
          <Box
            component="img"
            src={flag}
            alt={name}
            sx={{
              width: "74%",
              height: "74%",
              objectFit: "contain"
            }}
          />
        </Box>

      ) : (

        <Box
          component="img"
          src={flag}
          alt={name}
          sx={{
            width: flagWidth,
            height: flagHeight,
            objectFit: "contain"
          }}
        />

      )}

      {/* Name */}

      <Typography
        textAlign="center"
        sx={{

          minHeight:
            isCompact
              ? "auto"
              : 40,

          fontSize:
            isHero
              ? {
                  xs: "0.95rem",
                  sm: "1.1rem"
                }
              : {
                  xs: "0.85rem",
                  sm: "1rem"
                },

          fontWeight:
            isHero
              ? 600
              : 500,

          lineHeight: 1.15,

          overflowWrap: "anywhere",

          maxWidth:
            isHero
              ? {
                  xs: 90,
                  sm: 120
                }
              : "100%",

          transition: "0.2s",

          "&:hover":
            clickable && code
              ? {
                  textDecoration:
                    "underline"
                }
              : {}
        }}
      >
        {name || "A definir"}
      </Typography>

    </Stack>

  );
}