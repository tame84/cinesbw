import { getCinemas } from "@handlers/cinemas";
import { FastifyPluginCallback } from "fastify";

const cinemasRoutes: FastifyPluginCallback = (app, opts, done) => {
    app.get("/", getCinemas);

    done();
};

export default cinemasRoutes;
