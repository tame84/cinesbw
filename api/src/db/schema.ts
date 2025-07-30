import { pgTable, smallint, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const cinemasTable = pgTable("cinemas", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    website: text("website").notNull().unique(),
});

export const moviesTable = pgTable(
    "movies",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        slug: text("slug").notNull(),
        title: text("title").notNull(),
        poster: text("poster").notNull(),
        duration: text("duration"),
        genres: text("genres").array(),
        priority: smallint("priority").notNull().default(1),
    },
    (t) => [unique().on(t.slug)]
);

export const showsTable = pgTable(
    "shows",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        date: timestamp("date").notNull(),
        movieId: uuid("movie_id")
            .notNull()
            .references(() => moviesTable.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
    },
    (t) => [unique().on(t.date, t.movieId)]
);

export const schedulesTable = pgTable(
    "schedules",
    {
        time: text("time").notNull(),
        version: text("version").notNull(),
        url: text("url").notNull(),
        showId: uuid("show_id")
            .notNull()
            .references(() => showsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
        cinemaId: uuid("cinema_id")
            .notNull()
            .references(() => cinemasTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (t) => [unique().on(t.cinemaId, t.showId, t.version, t.time)]
);
