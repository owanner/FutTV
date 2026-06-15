import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Box
} from "@mui/material";

import TeamBadge from "../TeamBadge/TeamBadge";

export default function MatchDetailsHero({ match }) {

  if (!match) {
    return null;
  }

  const statusLabel =
    match.status === 3
      ? "AO VIVO"
      : match.status === 0
        ? "ENCERRADO"
        : "PRÓXIMO";

  const isLiveOrFinished = match.status === 3 || match.status === 0;

  const scoreLabel = isLiveOrFinished &&
    Number.isFinite(match.homeScore) &&
    Number.isFinite(match.awayScore)
    ? `${match.homeScore} x ${match.awayScore}`
    : "";

  const centerLabel = isLiveOrFinished ? scoreLabel : "VS";

  return (

    <Card
sx={{
  width: "100%",
  mx: "auto",
  overflow: "hidden",

  borderRadius: 1,

  boxShadow:
    "0 12px 40px rgba(0,0,0,.12)",

  border:
    "1px solid rgba(255,255,255,.08)",

  background:
    "linear-gradient(135deg,#006a67 0%,#155e63 45%,#5d7f43 100%)",

  color: "#fff"
}}
    >

      
      <CardContent
  sx={{
    pt: 4,
    pb: 4,
    px: {
      xs: 2,
      md: 4
    }
  }}
>

        {/* Header */}

<Stack
  direction="row"
  justifyContent="center"
  alignItems="space-between"
  spacing={3}
  mb={{ xs: 5, md: 7 }}
>
 <Typography
  sx={{
    fontSize: "1.15rem",
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.96)",
    lineHeight: 1
  }}
>
    {match.groupName || "SEM GRUPO"}
  </Typography>

  <Chip
    label={statusLabel}
    size="small"
    sx={{
      fontWeight: 700,
      bgcolor:
        match.status === 3
          ? "#DC2626"
          : match.status === 0
          ? "#475569"
          : "rgba(255,255,255,.15)",
      color: "#fff"
    }}
  />
</Stack>

        <Divider
          sx={{
            my: 1
          }}
        />

        {/* Times + placar */}
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: {
  xs: 3,
  md: 8
},
    maxWidth: 900,
    mx: "auto"
  }}
>
  
<Box
  sx={{
    display: "flex",
    justifyContent: "center"
  }}
>
  <TeamBadge
    name={match.homeTeam}
    flag={match.homeFlag}
    code={match.homeCode}
  />
</Box>


            <Box
  sx={{
    textAlign: "center",
    minWidth: {
  xs: 160,
  md: 280
}
  }}
>
  <Typography
    sx={{
      fontSize: {
        xs: "3rem",
        md: "4.5rem"
      },
      lineHeight: 1,
      fontWeight: 300
    }}
  >
    {centerLabel || "\u00A0"}
  </Typography>

<Typography
  sx={{
    mt: 1.5,
    fontSize: "1.05rem",
    fontWeight: 500,
    letterSpacing: "0.02em",
    color: "rgba(255,255,255,.75)"
  }}
>
    {match.stageName || "Partida"}
  </Typography>
</Box>
            <Box
  sx={{
    display: "flex",
    justifyContent: "center"
  }}
>
  <TeamBadge
    name={match.awayTeam}
    flag={match.awayFlag}
    code={match.awayCode}
  />
</Box>
        </Box>

        <Divider
          sx={{
            my: 3
          }}
        />

        {/* Estádio */}

        <Typography
          align="center"
        >

          📍 {

            match.stadium ||

            "Estádio não informado"

          }

        </Typography>

        {/* Árbitro */}

        <Typography

          align="center"

          color="text.secondary"

          sx={{
            mt: 1
          }}
        >

          Árbitro:

          {" "}

          {

            match.referee ||

            "Não informado"

          }

        </Typography>

      </CardContent>

    </Card>
  );
}