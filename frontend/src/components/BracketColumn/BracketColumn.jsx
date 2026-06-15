import {

  Stack,
  Typography

} from "@mui/material";

import BracketMatch
from "../BracketMatch/BracketMatch";

export default function BracketColumn({

  title,
  matches

}) {

  return (

    <Stack

      spacing={2}

      sx={{
        minWidth: 260
      }}
    >

      <Typography

        variant="h6"

        textAlign="center"
      >

        {title}

      </Typography>

      {

        matches.map(

          match => (

            <BracketMatch

              key={
                match.id
              }

              match={
                match
              }
            />
          )
        )
      }

    </Stack>
  );
}