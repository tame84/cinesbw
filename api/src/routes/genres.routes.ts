import { getGenres } from "@handlers/genres";
import { FastifyPluginCallback } from "fastify";

const genresRoutes: FastifyPluginCallback = (app, opts, done) => {
    app.get("/", getGenres);

    done();
};

export default genresRoutes;
