import { startScraping } from "@handlers/scrape";
import { FastifyPluginCallback } from "fastify";

const scrapeRoutes: FastifyPluginCallback = (app, opts, done) => {
    app.get("/", startScraping);

    done();
};

export default scrapeRoutes;
