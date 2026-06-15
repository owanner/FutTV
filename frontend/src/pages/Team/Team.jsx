import {

  useParams

} from "react-router-dom";

import {

  Typography

} from "@mui/material";

export default function Team() {

  const { code } =
    useParams();

  return (

    <Typography
      variant="h4"
    >

      Time {code}

    </Typography>
  );
}