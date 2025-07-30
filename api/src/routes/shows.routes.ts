import { getDates } from "@handlers/shows";
import { FastifyPluginCallback } from "fastify";

const showsRoutes: FastifyPluginCallback = (app, opts, done) => {
    app.get("/", getDates);

    done();
};

export default showsRoutes;
