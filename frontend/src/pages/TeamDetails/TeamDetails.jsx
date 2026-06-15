import {

    Alert,
    CircularProgress,
    Stack,
    Card,
    CardContent,
    Typography

} from "@mui/material";

import {

    useParams

} from "react-router-dom";

import {

    useTeam

} from "../../hooks/useTeam";

import TeamHeader
    from "../../components/TeamHeader/TeamHeader";

import MatchCard
    from "../../components/MatchCard/MatchCard";

import EmojiEventsIcon
    from "@mui/icons-material/EmojiEvents";

import SportsSoccerIcon
    from "@mui/icons-material/SportsSoccer";

import CheckCircleIcon
    from "@mui/icons-material/CheckCircle";

import HandshakeIcon
    from "@mui/icons-material/Handshake";

import CancelIcon
    from "@mui/icons-material/Cancel";

import TrendingUpIcon
    from "@mui/icons-material/TrendingUp";

import Box
    from "@mui/material/Box";

export default function TeamDetails() {

    const {

        code

    } = useParams();

    const {

        data,

        isLoading,

        error

    } = useTeam(code);

    if (isLoading) {

        return (
            <CircularProgress />
        );

    }

    if (error) {

        return (

            <Alert severity="error">

                Erro ao carregar seleção

            </Alert>

        );

    }

    return (

        <Stack spacing={3}>

            <TeamHeader
                team={data.team}
            />

            <Card>

                <CardContent>

                    <Typography
                        variant="h6"
                        gutterBottom
                    >

                        Estatísticas

                    </Typography>

                    <Box

                        sx={{

                            display: "grid",

                            gridTemplateColumns:

                                "repeat(2, 1fr)",

                            gap: 2,

                            mt: 2

                        }}

                    >

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <EmojiEventsIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Pontos

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {data.team.points}

                                </Typography>

                            </CardContent>

                        </Card>

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <SportsSoccerIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Jogos

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {data.team.played}

                                </Typography>

                            </CardContent>

                        </Card>

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <CheckCircleIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Vitórias

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {data.team.wins}

                                </Typography>

                            </CardContent>

                        </Card>

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <TrendingUpIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Saldo

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {

                                        data.team.goalDifference > 0

                                            ? `+${data.team.goalDifference}`

                                            : data.team.goalDifference

                                    }

                                </Typography>

                            </CardContent>

                        </Card>

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <HandshakeIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Empates

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {data.team.draws}

                                </Typography>

                            </CardContent>

                        </Card>

                        <Card
                            variant="outlined"
                        >

                            <CardContent>

                                <CancelIcon />

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >

                                    Derrotas

                                </Typography>

                                <Typography
                                    variant="h5"
                                >

                                    {data.team.losses}

                                </Typography>

                            </CardContent>

                        </Card>

                    </Box>

                </CardContent>

            </Card>

            <Card>

                <CardContent>

                    <Typography
                        variant="h6"
                    >

                        Próximos Jogos

                    </Typography>

                    <Stack
                        spacing={2}
                        sx={{
                            mt: 2
                        }}
                    >

                        {

                            data.nextMatches.map(

                                match => (

                                    <MatchCard

                                        key={match.id}

                                        match={match}

                                    />

                                )

                            )

                        }

                    </Stack>

                </CardContent>

            </Card>

            <Card>

                <CardContent>

                    <Typography
                        variant="h6"
                    >

                        Jogos Encerrados

                    </Typography>

                    <Stack
                        spacing={2}
                        sx={{
                            mt: 2
                        }}
                    >

                        {

                            data.finishedMatches.map(

                                match => (

                                    <MatchCard

                                        key={match.id}

                                        match={match}

                                    />

                                )

                            )

                        }

                    </Stack>

                </CardContent>

            </Card>

        </Stack>

    );

}