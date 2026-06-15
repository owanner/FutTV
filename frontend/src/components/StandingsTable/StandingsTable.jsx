import {

  Card,

  CardContent,

  Typography,

  Table,

  TableBody,

  TableCell,

  TableContainer,

  TableHead,

  TableRow

} from "@mui/material";

/**
 * ==========================================================
 * TABELA DE GRUPO
 * ==========================================================
 */
export default function StandingsTable({

  groupName,

  teams

}) {

  return (

    <Card
      sx={{
        mb: 3
      }}
    >

      <CardContent>

        <Typography

          variant="h6"

          gutterBottom
        >

          {groupName}

        </Typography>

        <TableContainer>

          <Table size="small">

            <TableHead>

              <TableRow>

                <TableCell>

                  #

                </TableCell>

                <TableCell>

                  Time

                </TableCell>

                <TableCell>

                  P

                </TableCell>

                <TableCell>

                  V

                </TableCell>

                <TableCell>

                  E

                </TableCell>

                <TableCell>

                  D

                </TableCell>

                <TableCell>

                  SG

                </TableCell>

                <TableCell>

                  PTS

                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {

                teams.map(team => (

                  <TableRow
                    key={team.id}
                  >

                    <TableCell>
                      {team.position}
                    </TableCell>

                    <TableCell>
                      {team.teamName}
                    </TableCell>

                    <TableCell>
                      {team.played}
                    </TableCell>

                    <TableCell>
                      {team.wins}
                    </TableCell>

                    <TableCell>
                      {team.draws}
                    </TableCell>

                    <TableCell>
                      {team.losses}
                    </TableCell>

                    <TableCell>
                      {
                        team.goalDifference
                      }
                    </TableCell>

                    <TableCell>
                      {team.points}
                    </TableCell>

                  </TableRow>
                ))
              }

            </TableBody>

          </Table>

        </TableContainer>

      </CardContent>

    </Card>
  );
}