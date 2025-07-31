import { addMoviesToDb, removeOldMoviesFromDb } from "@scraping/db-handlers";
import { getShows } from "@scraping/scrapers";
import { FastifyRequest, FastifyReply } from "fastify";

export const startScraping = async (request: FastifyRequest, reply: FastifyReply) => {
    const { apiKey } = request.query as { apiKey: string | undefined };

    if (!apiKey) {
        return reply.status(403).send("Unauthorized");
    }
    if (apiKey !== process.env.API_KEY) {
        return reply.status(403).send("Unauthorized");
    }

    const startTime = performance.now();
    console.info("Starting daily tasks");

    try {
        const movies = await getShows();
        await addMoviesToDb(movies);
        await removeOldMoviesFromDb();
    } catch (err) {
        console.error(err, "Something went wrong");
        return reply.status(500).send("Error while scraping");
    }

    const endTime = performance.now();
    console.info(`Tasks ended in ${(endTime - startTime).toFixed(0)} milliseconds`);
    return reply.status(200).send(`Tasks ended in ${(endTime - startTime).toFixed(0)} milliseconds`);
};
