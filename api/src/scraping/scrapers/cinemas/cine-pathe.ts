import { createUTCDate } from "@scraping/utils/dates";
import {
    capitalizeTitle,
    formatDurationFromMinutesToString,
    normalizeGenres,
    slugifyTitle,
} from "@scraping/utils/movies";
import { Show } from "@scraping/utils/types";
import axios from "axios";

interface MoviesResponseData {
    days: {
        [key: string]: never;
    };
    shows: Record<string, { days: Record<string, never> }>;
}

interface MovieResponseData {
    title: string;
    genres: string[];
    duration: number;
    posterPath: {
        lg: string;
        md: string;
    };
    isMovie: boolean;
}

interface TimesResponseData {
    time: string;
    version: string;
}

const CINEMA_ID = "5dd4d408-947b-4370-82d5-270bb67676ff";
const CINEMA_URL = "https://www.pathe.be/fr/cinemas/cinema-pathe-louvain-la-neuve";

const scrape = async (): Promise<Show[]> => {
    console.info("Scraping Pathé Louvain-la-Neuve...");

    const moviesResponse = await axios.get(
        "https://www.pathe.be/api/cinema/cinema-pathe-louvain-la-neuve/shows?language=fr",
        {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            },
        }
    );
    if (moviesResponse.statusText !== "OK")
        throw new Error(`Request to ${CINEMA_URL} failed with code ${moviesResponse.status}`);

    const moviesData: MoviesResponseData = moviesResponse.data;

    const shows: Show[] = [];

    for (const [slug, showData] of Object.entries(moviesData.shows)) {
        const movieResponse = await axios.get(`https://www.pathe.be/api/show/${slug}?language=fr`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            },
        });
        if (movieResponse.statusText !== "OK")
            throw new Error(`Request to ${CINEMA_URL} failed with code ${movieResponse.status}`);

        const movieData: MovieResponseData = movieResponse.data;

        let title = movieData.title.toLowerCase();
        if (title.includes("ciné-club")) {
            title = title.split("ciné-club:")[1].trim();
        }
        title = capitalizeTitle(title);
        const poster = movieData.posterPath.lg;
        const duration = formatDurationFromMinutesToString(movieData.duration);
        const genres = normalizeGenres(movieData.genres);
        const isMovie = movieData.isMovie;

        for (const [dateEntry] of Object.entries(showData.days)) {
            if (!dateEntry) continue;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [year, month, day] = dateEntry.split("-");
            const date = createUTCDate(Number(month), Number(day));

            const timesResponse = await axios.get(
                `https://www.pathe.be/api/show/${slug}/showtimes/cinema-pathe-louvain-la-neuve/${dateEntry}?language=fr`,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
                    },
                }
            );
            if (timesResponse.statusText !== "OK")
                throw new Error(`Request to ${CINEMA_URL} failed with code ${timesResponse.status}`);

            const timesData: TimesResponseData[] = timesResponse.data;

            const schedules: Show["schedules"] = [];

            for (const timeData of timesData) {
                const time = timeData.time.split(" ")[1]?.split(":").slice(0, 2).join("h") as string;
                let version = timeData.version;
                switch (version) {
                    case "vfbe":
                        version = "VF";
                        break;
                    case "vobe":
                        version = "VO";
                        break;
                    case "nlbe":
                        version = "NV";
                        break;
                    default:
                        break;
                }
                const baseUrl = isMovie
                    ? "https://www.pathe.be/fr/films-evenements/"
                    : "https://www.pathe.be/fr/evenements/";
                const url = baseUrl + slug;

                schedules.push({
                    time,
                    version,
                    url,
                    cinemaId: CINEMA_ID,
                });
            }

            shows.push({
                priority: 1,
                date,
                movie: {
                    slug: slugifyTitle(title),
                    title,
                    poster,
                    duration,
                    genres,
                },
                schedules,
            });
        }
    }

    return shows;
};

export default scrape;
