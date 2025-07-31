import "dotenv/config";
import cinemasRoutes from "@routes/cinemas.routes";
import genresRoutes from "@routes/genres.routes";
import moviesRoutes from "@routes/movies.routes";
import scrapeRoutes from "@routes/scrape.routes";
import showsRoutes from "@routes/shows.routes";
import Fastify from "fastify";
import fastifyCompress from "@fastify/compress";

declare const PhusionPassenger: any;
const isPassenger = typeof PhusionPassenger !== "undefined";

const app = Fastify({
    logger: true,
});

const registerFastifyPlugins = async () => {
    await app.register(fastifyCompress, {
        global: true,
        encodings: ["br", "gzip", "zstd", "deflate"],
    });
};
registerFastifyPlugins();

app.get("/", async (request, reply) => {
    return reply.status(200).send("OK");
});
app.register(moviesRoutes, { prefix: "/movies" });
app.register(showsRoutes, { prefix: "/shows" });
app.register(cinemasRoutes, { prefix: "/cinemas" });
app.register(genresRoutes, { prefix: "/genres" });
app.register(scrapeRoutes, { prefix: "/scrape" });

const start = async () => {
    try {
        if (isPassenger) {
            await app.listen({ path: "passenger", host: "127.0.0.1" });
        } else {
            await app.listen({ port: 3000 });
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
