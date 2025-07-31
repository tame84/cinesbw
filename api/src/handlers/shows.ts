import { db } from "@db/index";
import { showsTable } from "@db/schema";
import { FastifyReply, FastifyRequest } from "fastify";
export const getDates = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const results = await db.select({ date: showsTable.date }).from(showsTable).orderBy(showsTable.date);

        const datesSet = new Set(results.map((row) => row.date.toISOString()).flat());
        const dates = Array.from(datesSet.values());

        return reply.status(200).send(dates);
    } catch (err) {
        console.error(err);
        return reply.status(500).send("500 Internal Server Error");
    }
};
