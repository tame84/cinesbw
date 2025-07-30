import { createUTCDate } from "@scraping/utils/dates";
import { capitalizeTitle, formatDuration, normalizeGenres, slugifyTitle } from "@scraping/utils/movies";
import { Show } from "@scraping/utils/types";
import axios from "axios";
import * as cheerio from "cheerio";

const CINEMA_ID = "b4983222-8ceb-48b1-9331-98966972f975";
const CINEMA_URL = "https://lightsinthecity.be/jodoigne/";

const scrape = async (): Promise<Show[]> => {
    console.info("Scraping Cinéma l'étoile...");

    const pageResponse = await axios.get(CINEMA_URL);
    if (pageResponse.statusText !== "OK")
        throw new Error(`Request to ${CINEMA_URL} failed with code ${pageResponse.status}`);

    const pageHtml = pageResponse.data;
    const $page = cheerio.load(pageHtml);

    const dates: Date[] = [];

    $page("#affiche thead")
        .find("th")
        .each((i, el) => {
            const dateStr = $page(el).find("span").text().trim();
            if (!dateStr) return;

            const [day, month] = dateStr.split("/");
            const date = createUTCDate(Number(month), Number(day));
            dates.push(date);
        });

    const $movies = $page("#affiche tbody").find("tr");

    const shows: Show[] = [];

    for (const el of $movies) {
        const $link = $page(el).find("a");

        const url = $link.attr("href") as string;
        let title = $link.text().trim();
        title = capitalizeTitle(title.split("(")[0]?.trim() || title);
        const version = $page(el).find("td:nth-child(2)").text().trim().toUpperCase().split(" ")[0]!;
        let poster: string;
        let duration: string;
        let genres: string[];

        if (url) {
            const movieResponse = await axios.get(url);
            if (movieResponse.statusText !== "OK")
                throw new Error(`Request to ${url} failed with code ${movieResponse.status}`);

            const movieHtml = movieResponse.data;
            const $movie = cheerio.load(movieHtml);

            poster = $movie(".attachment-cover").attr("src") as string;
            duration = formatDuration($movie(".infos").find(".label:contains('Durée') + .info").text().trim());

            genres = normalizeGenres(
                $movie(".infos")
                    .find(".label:contains('Genre') + .info")
                    .text()
                    .split(",")
                    .map((genre) => genre.trim().charAt(0).toUpperCase() + genre.trim().slice(1).toLowerCase())
            );
        }

        dates.forEach((date, i) => {
            const time = $page(el)
                .find(`td:nth-child(${i + 3})`)
                .text()
                .trim(); // adjust index based on table structure

            if (time) {
                shows.push({
                    priority: 1,
                    date,
                    movie: {
                        slug: slugifyTitle(title),
                        title,
                        poster,
                        duration,
                        genres,
                    },
                    schedules: [
                        {
                            time,
                            version,
                            url,
                            cinemaId: CINEMA_ID,
                        },
                    ],
                });
            }
        });
    }

    return shows;
};

export default scrape;
