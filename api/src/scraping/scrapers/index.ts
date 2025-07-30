import type { Movie, Show } from "../utils/types";
import CineCentre from "./cinemas/cine-centre";
import CineEtoile from "./cinemas/cine-etoile";
import Cine4 from "./cinemas/cine4";
import CineWellington from "./cinemas/cine-wellington";
import CinePathe from "./cinemas/cine-pathe";
import CineImagibraine from "./cinemas/cine-imagibraine";

export const getShows = async (): Promise<Movie[]> => {
    const sources = await Promise.all([
        CineCentre(),
        CineEtoile(),
        Cine4(),
        CineWellington(),
        CinePathe(),
        CineImagibraine(),
    ]);
    const movies = mergeSources(sources);

    return movies;
};

const mergeSources = (sources: Show[][]): Movie[] => {
    const sourcesFlat = sources.flat();
    const movies = new Map<string, Movie>();

    for (const show of sourcesFlat) {
        const key = show.movie.slug;
        const existingMovie = movies.get(key);

        if (!existingMovie) {
            movies.set(key, {
                priority: show.priority,
                slug: show.movie.slug,
                title: show.movie.title,
                poster: show.movie.poster,
                duration: show.movie.duration,
                genres: show.movie.genres,
                shows: [
                    {
                        date: show.date,
                        schedules: show.schedules,
                    },
                ],
            });
        } else {
            existingMovie.shows.push({
                date: show.date,
                schedules: show.schedules,
            });

            if (show.priority <= existingMovie.priority) {
                if (existingMovie.poster === "" && show.movie.poster !== "") existingMovie.poster = show.movie.poster;
                if (existingMovie.duration === "" && show.movie.duration !== "")
                    existingMovie.duration = show.movie.duration;
                if (existingMovie.genres.length <= 0 && show.movie.genres.length > 0)
                    existingMovie.genres = show.movie.genres;
            } else {
                if (show.movie.poster !== "") existingMovie.poster = show.movie.poster;
                if (show.movie.duration !== "") existingMovie.duration = show.movie.duration;
                if (show.movie.genres.length > 0) existingMovie.genres = show.movie.genres;
                existingMovie.priority = show.priority;
            }
        }
    }

    return Array.from(movies.values());
};
