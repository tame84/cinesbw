import { db } from "@db/index";
import { cinemasTable, moviesTable, schedulesTable, showsTable } from "@db/schema";
import { and, arrayOverlaps, eq, ilike, inArray } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";

interface Schedule {
    time: string;
    version: string;
    url: string;
    cinema: {
        name: string;
    };
}

interface Movie {
    id: string;
    slug: string;
    title: string;
    poster: string;
    duration: string | null;
    genres: string[] | null;
    schedules: Schedule[];
}

interface MovieShows {
    date: Date;
    schedules: Schedule[];
}

export const getMovies = async (request: FastifyRequest, reply: FastifyReply) => {
    const { cinema, date, genre, query, version } = request.query as { [key: string]: string | undefined };

    const cinemaFilter = cinema ? cinema.split(",") : null;
    const today = new Date();
    const dateFilter = date
        ? new Date(date)
        : new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const genreFilter = genre
        ? genre.split(",").map((genre) => genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase())
        : null;
    const versionFilter = version ? version.split(",").map((version) => version.toUpperCase()) : null;

    const moviesFilters = [
        genreFilter ? arrayOverlaps(moviesTable.genres, genreFilter) : undefined,
        query ? ilike(moviesTable.title, `%${query}%`) : undefined,
    ].filter(Boolean);
    const schedulesFilters = [
        cinemaFilter ? inArray(schedulesTable.cinemaId, cinemaFilter) : undefined,
        versionFilter ? inArray(schedulesTable.version, versionFilter) : undefined,
    ].filter(Boolean);

    try {
        const results = await db
            .select({
                movie: {
                    id: moviesTable.id,
                    slug: moviesTable.slug,
                    title: moviesTable.title,
                    poster: moviesTable.poster,
                    duration: moviesTable.duration,
                    genres: moviesTable.genres,
                },
                show: { id: showsTable.id, date: showsTable.date },
                schedules: {
                    time: schedulesTable.time,
                    version: schedulesTable.version,
                    url: schedulesTable.url,
                },
                cinema: { name: cinemasTable.name },
            })
            .from(moviesTable)
            .innerJoin(showsTable, and(eq(showsTable.date, dateFilter), eq(showsTable.movieId, moviesTable.id)))
            .innerJoin(schedulesTable, and(eq(schedulesTable.showId, showsTable.id), ...schedulesFilters))
            .innerJoin(cinemasTable, eq(cinemasTable.id, schedulesTable.cinemaId))
            .where(and(...moviesFilters))
            .orderBy(moviesTable.slug, schedulesTable.time);

        const moviesMap = new Map<string, Movie>();

        for (const row of results) {
            const key = `${row.movie.id}_${row.show.id}`;

            if (!moviesMap.has(key)) {
                moviesMap.set(key, {
                    ...row.movie,
                    schedules: [],
                });
            }

            moviesMap.get(key)?.schedules!.push({
                ...row.schedules,
                cinema: row.cinema,
            });
        }

        const movies = Array.from(moviesMap.values());

        return reply.status(200).send(movies);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("500 Internal Server Error");
    }
};

export const getMovieShows = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { cinema, date, version } = request.query as { [key: string]: string | undefined };

    const cinemaFilter = cinema ? cinema.split(",") : null;
    const today = new Date();
    const dateFilter = date
        ? new Date(date)
        : new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const versionFilter = version ? version.split(",").map((version) => version.toUpperCase()) : null;

    const showsFilters = [dateFilter ? eq(showsTable.date, dateFilter) : undefined].filter(Boolean);
    const schedulesFilters = [
        cinemaFilter ? inArray(schedulesTable.cinemaId, cinemaFilter) : undefined,
        versionFilter ? inArray(schedulesTable.version, versionFilter) : undefined,
    ].filter(Boolean);

    try {
        const results = await db
            .select({
                movie: { id: moviesTable.id },
                show: { date: showsTable.date },
                schedules: {
                    time: schedulesTable.time,
                    version: schedulesTable.version,
                    url: schedulesTable.url,
                },
                cinema: { name: cinemasTable.name },
            })
            .from(moviesTable)
            .innerJoin(showsTable, and(eq(showsTable.movieId, moviesTable.id), ...showsFilters))
            .innerJoin(schedulesTable, and(eq(schedulesTable.showId, showsTable.id), ...schedulesFilters))
            .innerJoin(cinemasTable, eq(cinemasTable.id, schedulesTable.cinemaId))
            .where(eq(moviesTable.id, id))
            .orderBy(showsTable.date, schedulesTable.time);

        const showsMap = new Map<string, MovieShows>();

        for (const row of results) {
            const key = `${row.movie.id}_${row.show.date}`;

            if (!showsMap.has(key)) {
                showsMap.set(key, {
                    date: row.show.date,
                    schedules: [],
                });
            }

            showsMap.get(key)?.schedules!.push({
                ...row.schedules,
                cinema: row.cinema,
            });
        }

        const shows = Array.from(showsMap.values());

        return reply.status(200).send(shows);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("500 Internal Server Error");
    }
};
