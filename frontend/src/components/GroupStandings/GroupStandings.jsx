import {
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Divider,
  Box
} from "@mui/material";

import {
  useTheme,
  useMediaQuery
} from "@mui/material";

import {

  useNavigate

} from "react-router-dom";

function abbreviateTeamName(name) {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  if (parts.length <= 1) {
    return name;
  }

  const smallWords = [
    "do",
    "da",
    "dos",
    "das",
    "de",
    "e"
  ];

  const first = parts[0];

  const rest = parts.slice(1).map(word => {
    const lower = word.toLowerCase();

    if (smallWords.includes(lower)) {
      return lower;
    }

    return word;
  });

  return `${first.charAt(0)}. ${rest.join(" ")}`;
}

export default function GroupStandings({
  groupName,
  teams
}) {

  const navigate =
    useNavigate();
  const theme = useTheme();

  const isMobile =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const groupLetter =

    groupName.replace(
      "Grupo ",
      ""
    );

  return (

    <Card>

      <CardContent>

        {/* Nome do grupo */}

        <Typography

          variant="h6"

          fontWeight={700}

          gutterBottom

          sx={{

            cursor: "pointer",

            "&:hover": {

              opacity: 0.8

            }

          }}

          onClick={() =>

            navigate(

              `/group/${groupLetter}`

            )

          }

        >

          {groupName}

        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Cabeçalho da tabela */}

        <Stack
          direction="row"
          alignItems="center"
          sx={{
            mb: 1,
            px: 1,
            width: "100%"
          }}
        >

          <Box
            sx={{
              flex: {
                xs: "0 0 140px",
                md: 1
              },

              minWidth: {
                xs: 140,
                md: 280
              },
              pr: 1,

              borderRight: "2px solid",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.90rem",
                fontWeight: 700,
                color: "primary.main"
              }}
              variant="caption"
              fontWeight={800}
            >
              Seleção
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              P
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              PJ
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              V
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              E
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              D
            </Typography>
          </Box>

          <Box
            sx={{
              width: {
                xs: 36,
                md: 60
              },
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
            >
              SG
            </Typography>
          </Box>

        </Stack>

        <Divider sx={{ mb: 1 }} />

        {/* Times */}

        {

          teams.map(team => {

            let borderColor =
              "#e53935";

            if (
              team.position <= 2
            ) {

              borderColor =
                "#43a047";

            } else if (
              team.position === 3
            ) {

              borderColor =
                "#fbc02d";
            }

            return (

              <Stack
                key={team.teamId}
                direction="row"
                sx={{
                  width: "100%",
                  py: 1,
                  px: 1,
                  borderLeft: `4px solid ${borderColor}`
                }}
              >

                {/* Seleção */}

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{
                    flex: {
                      xs: "0 0 140px",
                      md: 1
                    },

                    minWidth: {
                      xs: 140,
                      md: 280
                    },

                    ml: 1,
                    pr: 1,

                    borderRight: "2px solid",
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >

                  <Avatar

                    src={team.flag}

                    alt={team.teamName}

                    sx={{
                      width: {
                        xs: 18,
                        md: 24
                      },

                      height: {
                        xs: 18,
                        md: 24
                      },

                      flexShrink: 0
                    }}

                  />
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",

                      fontSize: {
                        xs: "0.80rem",
                        md: "0.875rem"
                      },

                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",

                      "&:hover": {
                        textDecoration: "underline"
                      }
                    }}
                    onClick={() =>
                      navigate(
                        `/team/${team.teamCode}`
                      )
                    }
                  >
                    {isMobile
                      ? abbreviateTeamName(team.teamName)
                      : team.teamName}
                  </Typography>

                </Stack>


                {/* Pontos */}

                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography

                    fontWeight={700}

                    textAlign="center"
                  >

                    {team.points}

                  </Typography>

                </Box>

                {/* PJ */}
                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography
                    textAlign="center"
                  >

                    {team.played}

                  </Typography>

                </Box>

                {/* V */}

                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography
                    textAlign="center"
                  >

                    {team.wins}

                  </Typography>

                </Box>

                {/* E */}

                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography
                    textAlign="center"
                  >

                    {team.draws}

                  </Typography>

                </Box>

                {/* D */}

                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography
                    textAlign="center"
                  >

                    {team.losses}

                  </Typography>

                </Box>

                {/* SG */}

                <Box
                  sx={{
                    width: {
                      xs: 36,
                      md: 60
                    },
                    display: "flex",
                    justifyContent: "center"
                  }}
                >

                  <Typography

                    textAlign="center"

                    fontWeight={600}
                  >

                    {

                      team.goalDifference > 0

                        ? `+${team.goalDifference}`

                        : team.goalDifference

                    }

                  </Typography>

                </Box>

              </Stack>

            );

          })

        }

      </CardContent>

    </Card >

  );
}