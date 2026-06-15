import {
  Card,
  CardContent,
  Typography,
  Stack
} from "@mui/material";

export default function BracketMatch({
  match
}) {
  return (
    <Card
      variant="outlined"
    >
      <CardContent>
        <Stack
          spacing={1}
        >
          <Typography>
            {
              match.homeTeam ||
              "A definir"
            }
          </Typography>
          <Typography>
            {
              match.awayTeam ||
              "A definir"
            }
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
