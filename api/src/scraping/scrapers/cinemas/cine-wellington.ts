import { createUTCDate } from "@scraping/utils/dates";
import { capitalizeTitle, formatDuration, normalizeGenres, slugifyTitle } from "@scraping/utils/movies";
import { Show } from "@scraping/utils/types";
import axios from "axios";
import * as cheerio from "cheerio";

const CINEMA_ID = "b8e52605-7b96-49c0-b0cb-17507617f28c";
const CINEMA_URL = "https://www.cineswellington.com/";

const scrape = async (): Promise<Show[]> => {
    console.info("Scraping Cinés Wellington...");

    const pageResponse = await axios.get(CINEMA_URL);
    if (pageResponse.statusText !== "OK")
        throw new Error(`Request to ${CINEMA_URL} failed with code ${pageResponse.status}`);

    const pageHtml = pageResponse.data;
    const $page = cheerio.load(pageHtml);

    const $movies = $page("#affiche").find(".port-inner");

    const shows: Show[] = [];

    for (const el of $movies) {
        const url = (CINEMA_URL + $page(el).find(".port-link").attr("href")) as string;

        const movieResponse = await axios.get(url);
        if (movieResponse.statusText !== "OK")
            throw new Error(`Request to ${CINEMA_URL} failed with code ${movieResponse.status}`);

        const movieHtml = movieResponse.data;
        const $movie = cheerio.load(movieHtml);
        const title = capitalizeTitle($movie("h3").text().trim());
        const poster = $page(el).find(".port-img > img").attr("src") as string;
        const duration = formatDuration($movie('span:contains("durée") + .color_info').text().trim().toLowerCase());

        const genres = normalizeGenres(
            $movie('span:contains("genre") + .color_info')
                .text()
                .split(",")
                .filter((genre) => genre !== "")
                .map((genre) => genre.trim().charAt(0).toUpperCase() + genre.trim().slice(1).toLowerCase())
        );

        $movie(".bl_date").each((i, el) => {
            const dateStr = $movie(el).text().trim().split(" ")[1];
            if (!dateStr) return;

            const [day, month] = dateStr.split("/");
            const date = createUTCDate(Number(month), Number(day));

            const schedules: Show["schedules"] = [];

            let nextElement = $movie(el).next();

            while (nextElement.length > 0 && !nextElement.hasClass("bl_date")) {
                nextElement.find(".color_info").each((i, el) => {
                    const time = $movie(el).text().trim().split(" ")[0]?.toLowerCase() as string;
                    const version = $movie(el).find("sup").text().trim();

                    schedules.push({
                        time,
                        version,
                        url,
                        cinemaId: CINEMA_ID,
                    });
                });

                nextElement = nextElement.next();
            }

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
                schedules,
            });
        });
    }

    return shows;
};

export default scrape;
