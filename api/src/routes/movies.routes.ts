import { getMovies, getMovieShows } from "@handlers/movies";
import { FastifyPluginCallback } from "fastify";

const moviesRoutes: FastifyPluginCallback = (app, opts, done) => {
    app.get("/", getMovies);
    app.get("/:id/shows", getMovieShows);

    done();
};

export default moviesRoutes;
