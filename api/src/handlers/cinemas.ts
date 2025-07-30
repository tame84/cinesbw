import { db } from "@db/index";
import { cinemasTable } from "@db/schema";
import { FastifyReply, FastifyRequest } from "fastify";

export const getCinemas = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const cinemas = await db
            .select({ name: cinemasTable.name, id: cinemasTable.id })
            .from(cinemasTable)
            .orderBy(cinemasTable.name);

        return reply.status(200).send(cinemas);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("500 Internal Server Error");
    }
};
