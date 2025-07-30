import { db } from "@db/index";
import { moviesTable } from "@db/schema";
import { FastifyReply, FastifyRequest } from "fastify";

export const getGenres = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const results = await db.select({ genres: moviesTable.genres }).from(moviesTable);

        const genresSet = new Set(
            results
                .map((row) => row.genres)
                .flat()
                .filter((genre) => genre !== null)
        );
        const genres = Array.from(genresSet.values()).sort();

        return reply.status(200).send(genres);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("500 Internal Server Error");
    }
};
