import { db } from "@db/index";
import { moviesTable, schedulesTable, showsTable } from "@db/schema";
import { eq, lt, inArray, sql, isNull } from "drizzle-orm";
import { createUTCDate } from "./utils/dates";
import { Movie } from "./utils/types";

export const addMoviesToDb = async (movies: Movie[]) => {
    const moviesResults = await db
        .select({
            id: moviesTable.id,
            slug: moviesTable.slug,
            poster: moviesTable.poster,
            duration: moviesTable.duration,
            genres: moviesTable.genres,
            priority: moviesTable.priority,
        })
        .from(moviesTable)
        .where(
            inArray(
                moviesTable.slug,
                movies.map((m) => m.slug)
            )
        );
    const existingMoviesMap = new Map(moviesResults.map((movie) => [movie.slug, movie]));

    const moviesToInsert: Array<typeof moviesTable.$inferInsert> = [];
    const moviesToUpdate: Array<{ id: string; data: Partial<typeof moviesTable.$inferInsert> }> = [];

    const movieSlugToId = new Map<string, string>();

    for (const movie of movies) {
        const existingMovie = existingMoviesMap.get(movie.slug);

        if (!existingMovie) {
            moviesToInsert.push({
                slug: movie.slug,
                title: movie.title,
                poster: movie.poster,
                duration: movie.duration,
                genres: movie.genres,
                priority: movie.priority,
            });
        } else {
            movieSlugToId.set(movie.slug, existingMovie.id);

            const updates: Partial<typeof moviesTable.$inferInsert> = {};
            let needsUpdate = false;

            if (movie.priority <= existingMovie.priority) {
                if (existingMovie.poster === "" && movie.poster !== "") {
                    updates.poster = movie.poster;
                    needsUpdate = true;
                }
                if (existingMovie.duration === "" && movie.duration !== "") {
                    updates.duration = movie.duration;
                    needsUpdate = true;
                }
                if ((!existingMovie.genres || existingMovie.genres.length <= 0) && movie.genres.length > 0) {
                    updates.genres = movie.genres;
                    needsUpdate = true;
                }
            } else {
                if (movie.poster !== "") {
                    updates.poster = movie.poster;
                    needsUpdate = true;
                }
                if (movie.duration !== "") {
                    updates.duration = movie.duration;
                    needsUpdate = true;
                }
                if (movie.genres.length > 0) {
                    updates.genres = movie.genres;
                    needsUpdate = true;
                }
                updates.priority = movie.priority;
            }

            if (needsUpdate) {
                moviesToUpdate.push({ id: existingMovie.id, data: updates });
            }
        }
    }

    if (moviesToInsert.length > 0) {
        const insertedMovies = await db
            .insert(moviesTable)
            .values(moviesToInsert)
            .returning({ id: moviesTable.id, slug: moviesTable.slug });

        for (const inserted of insertedMovies) {
            movieSlugToId.set(inserted.slug, inserted.id);
        }
    }

    for (const { id, data } of moviesToUpdate) {
        await db.update(moviesTable).set(data).where(eq(moviesTable.id, id));
    }

    await addShowsAndSchedules(movies, movieSlugToId);

    console.info(`Added ${moviesToInsert.length} new movies to database`);
    console.info(`Updated ${moviesToUpdate.length} movies from database`);
};

const addShowsAndSchedules = async (movies: Movie[], movieSlugToId: Map<string, string>) => {
    const showsToInsert: Array<typeof showsTable.$inferInsert> = [];
    const showToMoviesSlugMap = new Map<string, string>();
    const seenShows = new Set<string>();

    for (const movie of movies) {
        const movieId = movieSlugToId.get(movie.slug);
        if (!movieId) continue;

        for (const show of movie.shows) {
            const showKey = `${movieId}_${show.date.toISOString()}`;

            if (!seenShows.has(showKey)) {
                showsToInsert.push({
                    date: show.date,
                    movieId,
                });
                showToMoviesSlugMap.set(showKey, movie.slug);
                seenShows.add(showKey);
            }
        }
    }

    if (showsToInsert.length <= 0) return;

    const insertedShows = await db
        .insert(showsTable)
        .values(showsToInsert)
        .onConflictDoUpdate({
            target: [showsTable.date, showsTable.movieId],
            set: {
                date: sql.raw(`excluded.date`),
                movieId: sql.raw(`excluded.movie_id`),
            },
        })
        .returning({
            id: showsTable.id,
            date: showsTable.date,
            movieId: showsTable.movieId,
        });

    const showIdMap = new Map<string, string>();

    for (const show of insertedShows) {
        const showKey = `${show.movieId}_${show.date.toISOString()}`;
        showIdMap.set(showKey, show.id);
    }

    const schedulesToInsert: Array<typeof schedulesTable.$inferInsert> = [];
    const seenSchedules = new Set<string>();

    for (const movie of movies) {
        const movieId = movieSlugToId.get(movie.slug);
        if (!movieId) continue;

        for (const show of movie.shows) {
            const showKey = `${movieId}_${show.date.toISOString()}`;
            const showId = showIdMap.get(showKey);
            if (!showId) continue;

            for (const schedule of show.schedules) {
                const scheduleKey = `${schedule.cinemaId}_${showId}_${schedule.version}_${schedule.time}`;

                if (!seenSchedules.has(scheduleKey)) {
                    schedulesToInsert.push({
                        time: schedule.time,
                        version: schedule.version,
                        url: schedule.url,
                        showId,
                        cinemaId: schedule.cinemaId,
                    });
                    seenSchedules.add(scheduleKey);
                }
            }
        }
    }

    if (schedulesToInsert.length > 0) {
        await db
            .insert(schedulesTable)
            .values(schedulesToInsert)
            .onConflictDoUpdate({
                target: [schedulesTable.cinemaId, schedulesTable.showId, schedulesTable.version, schedulesTable.time],
                set: {
                    time: sql.raw(`excluded.time`),
                    version: sql.raw(`excluded.version`),
                    url: sql.raw(`excluded.url`),
                    showId: sql.raw(`excluded.show_id`),
                    cinemaId: sql.raw(`excluded.cinema_id`),
                },
            });
    }

    console.info(`Added ${showsToInsert.length} new shows to database`);
    console.info(`Added ${schedulesToInsert.length} new schedules to database`);
};

export const removeOldMoviesFromDb = async () => {
    const today = createUTCDate(new Date().getMonth() + 1, new Date().getDate());

    const deletedShows = await db
        .delete(showsTable)
        .where(lt(showsTable.date, today))
        .returning({ movieId: showsTable.movieId });

    if (deletedShows.length <= 0) return;

    const moviesWithoutShows = await db
        .select({ id: moviesTable.id })
        .from(moviesTable)
        .leftJoin(showsTable, eq(moviesTable.id, showsTable.movieId))
        .where(isNull(showsTable.movieId))
        .groupBy(moviesTable.id);

    console.info(`Removed ${moviesWithoutShows.length} old movies and their shows and schedules from database`);
};
