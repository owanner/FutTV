import { Card, CardContent, Typography, Stack, Avatar, Chip } from "@mui/material";

export default function TeamHeader({ team }) {
  let color = "error";
  let label = "Eliminado";

  if (team.status === "qualified") {
    color = "success";
    label = "Classificado";
  }

  if (team.status === "playoff") {
    color = "warning";
    label = "Melhor 3º";
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={team.flag} sx={{ width: 64, height: 64 }} />
          <Stack>
            <Typography variant="h4">{team.teamName}</Typography>
            <Typography color="text.secondary">{team.groupName}</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip color={color} label={label} />
          <Chip color="default" label={`${team.position}º Lugar`} />
        </Stack>
      </CardContent>
    </Card>
  );
}
