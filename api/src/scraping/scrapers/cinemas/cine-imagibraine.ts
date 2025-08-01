import { parseDateFromISOString, parseTimeFromISOString } from "@scraping/utils/dates";
import {
    capitalizeTitle,
    formatDurationFromMinutesToString,
    normalizeEventName,
    normalizeGenres,
    slugifyTitle,
} from "@scraping/utils/movies";
import { Show } from "@scraping/utils/types";
import axios from "axios";

interface MoviesResponseData {
    sessions: {
        complexOperator: string;
        event?: {
            code: string;
        };
        film: {
            corporateId: number;
            id: string;
        };
    }[];
}

interface SessionsResponseData {
    complexOperator: string;
    showtime: string;
    event?: {
        shortName: string;
    };
    film: {
        data: {
            id: string;
            corporateId: number;
            title: string;
            duration: number;
            imdbCode: string;
            spokenLanguage: {
                name: string;
            };
            audioLanguage: string;
            images: {
                mediaType: string;
                url: string;
            }[];
            genres: {
                name: string;
            }[];
        };
    };
}

interface MovieDetailsTMDB {
    title: string;
    poster_path: string;
    genres: {
        name: string;
    }[];
    runtime: number;
}

interface MovieDetails {
    title: string;
    images: {
        mediaType: string;
        url: string;
    }[];
    duration: number;
    genres: {
        name: string;
    }[];
}

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5; rv:127.0) Gecko/20100101 Firefox/127.0",
];

const HEADERS_WITHOUT_USER_AGENT = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9",
    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
};

const getRandomUserAgent = (): string => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

const randomDelay = async (min: number = 300): Promise<void> => {
    const delay = Math.random() * 200 + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
};

const CINEMA_ID = "d26b9d02-4f5a-4eea-9e84-552a1fd61b2f";
const CINEMA_URL = "https://kinepolis.be/fr/fr/movies/overview/?complex=KBRAI&main_section=tous+les+films";

const scrape = async () => {
    console.log("Scraping Kinepolis Imagibraine...");

    await randomDelay();
    const moviesResponse = await axios.get(
        "https://kinepolisweb-programmation.kinepolis.com/api/Programmation/BE/FR/WWW/Cinema/KinepolisBelgium",
        {
            headers: {
                "User-Agent": getRandomUserAgent(),
                ...HEADERS_WITHOUT_USER_AGENT,
            },
        }
    );
    if (moviesResponse.statusText !== "OK") {
        throw new Error(
            `Request to https://kinepolisweb-programmation.kinepolis.com/api/Programmation/BE/FR/WWW/Cinema/KinepolisBelgium failed with code ${moviesResponse.status}`
        );
    }
    const moviesResponseData: MoviesResponseData = moviesResponse.data;
    const moviesData = moviesResponseData.sessions.flatMap((movie) => {
        if (movie.complexOperator === "KBRAI") {
            return [
                {
                    id: movie.film.corporateId,
                    versionId: movie.film.id,
                    event: {
                        code: movie.event?.code,
                    },
                },
            ];
        } else {
            return [];
        }
    });
    if (moviesData.length <= 0) {
        return [];
    }

    const moviesMap = new Map<string, { id: number; versionId: string; event: { code?: string } }>();

    for (const movie of moviesData) {
        const key = `${movie.id}_${movie.versionId}`;
        const isMovieExists = moviesMap.has(key);

        if (!isMovieExists) {
            moviesMap.set(key, movie);
        }
    }

    const shows: Show[] = [];

    for (const movie of moviesMap.values()) {
        let pageUrl: string;
        let fetchUrl: string;
        if (movie.event.code) {
            pageUrl = `https://kinepolis.be/fr/movies/detail/${movie.id}/${movie.versionId}/${movie.event.code}`;
            fetchUrl = `https://kinepolisweb-programmation.kinepolis.com/api/Sessions/BE/FR/${movie.id}/WWW/Cinema/KinepolisBelgium/${movie.event.code}`;
        } else {
            pageUrl = `https://kinepolis.be/fr/movies/detail/${movie.id}/${movie.versionId}`;
            fetchUrl = `https://kinepolisweb-programmation.kinepolis.com/api/Sessions/BE/FR/${movie.id}/WWW/Cinema/KinepolisBelgium`;
        }

        await randomDelay();
        const sessionsResponse = await axios.get(fetchUrl, {
            headers: {
                "User-Agent": getRandomUserAgent(),
                ...HEADERS_WITHOUT_USER_AGENT,
            },
        });
        if (sessionsResponse.statusText !== "OK") {
            throw new Error(`Request to ${fetchUrl} failed with code ${sessionsResponse.status}`);
        }
        const sessionsResponseData: SessionsResponseData[] = sessionsResponse.data;
        const sessionsData = sessionsResponseData.flatMap((session) => {
            if (session.complexOperator === "KBRAI") {
                const [dateStr, timeStr] = session.showtime.split("T");
                if (!dateStr || !timeStr) {
                    return [];
                }
                const date = parseDateFromISOString(dateStr);
                const time = parseTimeFromISOString(session.showtime);
                let version: "VF" | "VO" | "NV";
                switch (session.film.data.spokenLanguage.name.toLowerCase()) {
                    case "version française":
                        version = "VF";
                        break;
                    case "version anglaise":
                        version = "VO";
                        break;
                    case "version néerlandaise":
                        version = "NV";
                        break;
                    default:
                        version = "VO";
                        break;
                }

                return [
                    {
                        date,
                        time,
                        version,
                        movie: {
                            imdbId: session.film.data.imdbCode,
                            id: session.film.data.corporateId,
                            versionId: session.film.data.id,
                            audioLanguage: session.film.data.audioLanguage,
                            event: {
                                shortName: session.event?.shortName,
                            },
                        },
                    },
                ];
            } else {
                return [];
            }
        });
        if (!sessionsData[0]) continue;

        const imdbId = sessionsData[0].movie.imdbId;
        const frenchSession = sessionsData.find((session) => session?.movie.audioLanguage === "FR");

        let title: string;
        let poster: string;
        let duration: string;
        let genres: string[];

        if (!frenchSession) {
            if (!imdbId || !imdbId.startsWith("tt")) continue;
            const movieDetailsResponse = await axios.get(
                `https://api.themoviedb.org/3/movie/${imdbId}?language=fr-BE`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                    },
                }
            );
            if (movieDetailsResponse.statusText !== "OK") {
                throw new Error(
                    `Request to https://api.themoviedb.org/3/movie/${imdbId}?language=fr-BE failed with code ${movieDetailsResponse.status}`
                );
            }
            const movieDetailsResponseData: MovieDetailsTMDB = movieDetailsResponse.data;

            title = movieDetailsResponseData.title;
            poster = movieDetailsResponseData.poster_path
                ? "https://image.tmdb.org/t/p/w342" + movieDetailsResponseData.poster_path
                : "";
            duration =
                movieDetailsResponseData.runtime > 0
                    ? formatDurationFromMinutesToString(movieDetailsResponseData.runtime)
                    : "";
            genres = normalizeGenres(movieDetailsResponseData.genres.map((genre) => genre.name));
        } else {
            await randomDelay();
            const movieDetailsResponse = await axios.get(
                `https://kinepolisweb-programmation.kinepolis.com/api/Details/BE/FR/${frenchSession.movie.versionId}/WWW`,
                {
                    headers: {
                        "User-Agent": getRandomUserAgent(),
                        ...HEADERS_WITHOUT_USER_AGENT,
                    },
                }
            );
            if (movieDetailsResponse.statusText !== "OK") {
                throw new Error(
                    `Request to https://kinepolisweb-programmation.kinepolis.com/api/Details/BE/FR/${frenchSession.movie.versionId}/WWW failed with code ${movieDetailsResponse.status}`
                );
            }
            const movieDetailsResponseData: MovieDetails = movieDetailsResponse.data;
            if (!movieDetailsResponseData) continue;

            title = movieDetailsResponseData.title;
            if (frenchSession.movie.event.shortName) {
                if (["OperLive", "OperRepr"].includes(frenchSession.movie.event.shortName)) {
                    return [];
                }
                const eventName = normalizeEventName(frenchSession.movie.event.shortName);
                const titleSplited = title.split(eventName);
                if (Array.isArray(titleSplited) && titleSplited.length === 2) {
                    title = titleSplited[1];
                }
            }
            title = title.split("(")[0]?.trim() || title;
            const posterUrl = movieDetailsResponseData.images.find(
                (image) => image.mediaType === "Poster Graphic"
            )?.url;
            poster = posterUrl ? "https://cdn.kinepolis.be/images" + posterUrl : "";
            duration =
                movieDetailsResponseData.duration > 0
                    ? formatDurationFromMinutesToString(movieDetailsResponseData.duration)
                    : "";
            genres = normalizeGenres(movieDetailsResponseData.genres.map((genre) => genre.name));
        }

        const showsMap = new Map<string, Show>();

        for (const show of sessionsData) {
            const key = show.date.toISOString().split("T")[0];
            const existingShow = showsMap.get(key);

            if (!existingShow) {
                showsMap.set(key, {
                    priority: 10,
                    date: show.date,
                    movie: {
                        slug: slugifyTitle(title),
                        title: capitalizeTitle(title),
                        poster,
                        duration,
                        genres,
                    },
                    schedules: [
                        {
                            time: show.time,
                            version: show.version,
                            url: pageUrl,
                            cinemaId: CINEMA_ID,
                        },
                    ],
                });
            } else {
                existingShow.schedules.push({
                    time: show.time,
                    version: show.version,
                    url: pageUrl,
                    cinemaId: CINEMA_ID,
                });
            }
        }

        const moviesShows: Show[] = Array.from(showsMap.values());
        shows.push(...moviesShows);
    }

    return shows;
};

export default scrape;
