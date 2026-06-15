import {

  Stack,

  TextField,

  FormControl,

  InputLabel,

  Select,

  MenuItem

} from "@mui/material";

export default function MatchesFilters({

  search,

  setSearch,

  status,

  setStatus

}) {

  return (

    <Stack

      spacing={2}

      sx={{
        mb: 3
      }}
    >

      <TextField

        label="Buscar seleção"

        value={search}

        onChange={event =>

          setSearch(
            event.target.value
          )
        }
      />

      <FormControl>

        <InputLabel>

          Status

        </InputLabel>

        <Select

          value={status}

          label="Status"

          onChange={event =>

            setStatus(
              event.target.value
            )
          }
        >

          <MenuItem value="">

            Todos

          </MenuItem>

          <MenuItem value="live">

            Ao vivo

          </MenuItem>

          <MenuItem value="upcoming">

            Próximos

          </MenuItem>

          <MenuItem value="finished">

            Encerrados

          </MenuItem>

        </Select>

      </FormControl>

    </Stack>
  );
}