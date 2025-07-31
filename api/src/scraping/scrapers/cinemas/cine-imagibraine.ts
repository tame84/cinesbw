import { createUTCDate, formatShowTime } from "@scraping/utils/dates";
import {
    capitalizeTitle,
    formatDurationMintuesToString,
    normalizeEventName,
    normalizeGenres,
    slugifyTitle,
} from "@scraping/utils/movies";
import { Show } from "@scraping/utils/types";
import axios from "axios";

const CINEMA_ID = "d26b9d02-4f5a-4eea-9e84-552a1fd61b2f";
const CINEMA_URL = "https://kinepolis.be/fr/fr/movies/overview/?complex=KBRAI&main_section=tous+les+films";

interface SessionsResponseData {
    sessions: {
        complexOperator: string;
        showtime: string;
        film: {
            corporateId: number;
            id: string;
            event?: {
                code: string;
                name: string;
            };
        };
    }[];
}

interface ShowsResponseData {
    businessDay: string;
    complexOperator: string;
    film: {
        id: string;
        data: {
            spokenLanguage: {
                name: "Version Anglaise" | "Version Française";
            };
            imdbCode: string;
            audioLanguage: string;
            title: string;
        };
    };
    showtime: string;
}

interface KineMovieResponseData {
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

interface MovieResponseData {
    title: string;
    poster_path: string;
    genres: {
        name: string;
    }[];
    runtime: number;
}

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5; rv:127.0) Gecko/20100101 Firefox/127.0",
];

const getRandomUserAgent = (): string => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

const randomDelay = async (min: number = 300): Promise<void> => {
    const delay = Math.random() * 200 + min;

    return new Promise((resolve) => setTimeout(resolve, delay));
};

const parseDateFromISOString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-");
    return createUTCDate(Number(month), Number(day));
};

const scrape = async (): Promise<Show[]> => {
    console.info("Scraping Kinepolis Imagibraine...");

    await randomDelay();
    const sessionsResponse = await axios.get(
        "https://kinepolisweb-programmation.kinepolis.com/api/Programmation/BE/FR/WWW/Cinema/KinepolisBelgium",
        {
            headers: {
                "User-Agent": getRandomUserAgent(),
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "fr-FR,fr;q=0.9",
                "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
            },
        }
    );
    if (sessionsResponse.statusText !== "OK")
        throw new Error(`Request to ${CINEMA_URL} failed with code ${sessionsResponse.status}`);

    const sessionsData: SessionsResponseData = sessionsResponse.data;
    const complexSessions = sessionsData.sessions.flatMap((session) =>
        session.complexOperator === "KBRAI"
            ? [
                  {
                      showtime: session.showtime,
                      movieId: session.film.corporateId,
                      versionId: session.film.id,
                      event: {
                          code: session.film.event?.code,
                          name: session.film.event?.name,
                      },
                  },
              ]
            : []
    );

    if (complexSessions.length <= 0) return [];

    const complexSessionsMap = new Map<
        string,
        {
            date: Date;
            time: string;
            movieId: number;
            versionId: string;
            event: { code: string | undefined; name: string | undefined };
        }
    >();

    for (const session of complexSessions) {
        const key = `${session.movieId}_${session.versionId}_${session.showtime}`;

        if (!complexSessionsMap.has(key)) {
            const [dateStr, ...rest] = session.showtime.split("T");
            const date = parseDateFromISOString(dateStr);
            const time = formatShowTime(session.showtime);

            if (["Opéra Live", "Opéra"].includes(String(session.event.name))) {
                continue;
            }

            complexSessionsMap.set(key, {
                date,
                time,
                versionId: session.versionId,
                movieId: session.movieId,
                event: {
                    code: session.event.code,
                    name: session.event.name,
                },
            });
        }
    }

    const shows: Show[] = [];

    for (const iterable of complexSessionsMap) {
        const session = iterable[1];
        const url = `https://kinepolis.be/fr/movies/detail/${session.movieId}/${session.versionId}`;

        await randomDelay();
        const fetchUrl = session.event.code
            ? `https://kinepolisweb-programmation.kinepolis.com/api/Sessions/BE/FR/${session.movieId}/WWW/Cinema/KinepolisBelgium/${session.event.code}`
            : `https://kinepolisweb-programmation.kinepolis.com/api/Sessions/BE/FR/${session.movieId}/WWW/Cinema/KinepolisBelgium`;
        const showsResponse = await axios.get(fetchUrl, {
            headers: {
                "User-Agent": getRandomUserAgent(),
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "fr-FR,fr;q=0.9",
                "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
            },
        });
        if (showsResponse.statusText !== "OK") {
            throw new Error(`Request to ${CINEMA_URL} failed with code ${showsResponse.status}`);
        }

        const sessionData: ShowsResponseData[] = showsResponse.data;

        const showsData = sessionData
            .filter((s) => s.complexOperator === "KBRAI")
            .map((s) => {
                const dateStr = s.businessDay.split("T")[0];
                if (!dateStr) return null;

                const date = parseDateFromISOString(dateStr);

                let version: "VF" | "VO" | "NV";

                if (s.film.data.spokenLanguage.name === "Version Anglaise") {
                    version = "VO";
                } else if (s.film.data.spokenLanguage.name === "Version Française") {
                    version = "VF";
                } else if (s.film.data.spokenLanguage.name === "Version néerlandaise") {
                    version = "NV";
                } else {
                    version = "VO";
                }

                return {
                    date: date,
                    time: formatShowTime(s.showtime),
                    version,
                    imdbId: s.film.data.imdbCode,
                    id: s.film.id,
                    audioLanguage: s.film.data.audioLanguage,
                };
            })
            .filter((s) => s !== null);
        if (!showsData[0]) continue;
        const imdbId = showsData[0].imdbId;
        if (!imdbId || !imdbId.startsWith("tt")) continue;

        const id = showsData.find((s) => s.audioLanguage === "FR")?.id;

        let title: string;
        let poster: string;
        let duration: string;
        let genres: string[];

        if (!id) {
            const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${imdbId}?language=fr-BE`, {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                },
            });
            if (detailsResponse.statusText !== "OK")
                throw new Error(`Request to TMDB failed with code ${detailsResponse.status}`);

            const details: MovieResponseData = detailsResponse.data;

            title = details.title;
            poster = details.poster_path ? "https://image.tmdb.org/t/p/w342" + details.poster_path : "";
            duration = details.runtime !== 0 ? formatDurationMintuesToString(details.runtime) : "";
            genres = normalizeGenres(details.genres.map((g) => g.name));
        } else {
            await randomDelay();
            const kineDetailsResponse = await axios.get(
                `https://kinepolisweb-programmation.kinepolis.com/api/Details/BE/FR/${id}/WWW`,
                {
                    headers: {
                        "User-Agent": getRandomUserAgent(),
                        Accept: "application/json, text/plain, */*",
                        "Accept-Language": "fr-FR,fr;q=0.9",
                        "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
                    },
                }
            );
            if (kineDetailsResponse.statusText !== "OK")
                throw new Error(`Request to Kinepolis failed with code ${kineDetailsResponse.status}`);

            const kineDetails: KineMovieResponseData = kineDetailsResponse.data;

            title = kineDetails.title;
            if (session.event.name) {
                const eventName = normalizeEventName(session.event.name);
                const titleSplited = title.split(`${eventName}:`);
                if (Array.isArray(titleSplited) && titleSplited.length >= 2) {
                    title = titleSplited[1];
                } else {
                    title = titleSplited[0];
                }
            }

            title = capitalizeTitle(title.split("(")[0]?.trim() || title);
            const kineMovieUrl = kineDetails.images.filter((i) => i.mediaType === "Poster Graphic")[0];
            poster = kineMovieUrl ? "https://cdn.kinepolis.be/images" + kineMovieUrl.url : "";
            duration = kineDetails.duration !== 0 ? formatDurationMintuesToString(kineDetails.duration) : "";
            genres = normalizeGenres(kineDetails.genres.map((g) => g.name));
        }

        const showsMap = new Map<string, Show>();

        for (const showData of showsData) {
            const key = showData.date.toISOString().split("T")[0];

            const existingShow = showsMap.get(key);

            if (!existingShow) {
                showsMap.set(key, {
                    priority: 10,
                    date: showData.date,
                    movie: {
                        slug: slugifyTitle(title),
                        title,
                        poster,
                        duration,
                        genres,
                    },
                    schedules: [
                        {
                            time: showData.time,
                            version: showData.version,
                            url,
                            cinemaId: CINEMA_ID,
                        },
                    ],
                });
            } else {
                existingShow.schedules.push({
                    time: showData.time,
                    version: showData.version,
                    url,
                    cinemaId: CINEMA_ID,
                });
            }
        }

        const movieShows: Show[] = Array.from(showsMap.values());
        shows.push(...movieShows);
    }

    return shows;
};

export default scrape;
