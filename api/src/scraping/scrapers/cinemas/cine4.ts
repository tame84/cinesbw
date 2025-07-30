import { createUTCDate } from '../../utils/dates';
import { capitalizeTitle, formatDuration, normalizeGenres, slugifyTitle } from '../../utils/movies';
import type { Show } from '../../utils/types';
import axios from 'axios';
import * as cheerio from 'cheerio';

const CINEMA_ID = 'e44462f6-abac-4b5f-a475-682655a099b3';
const CINEMA_URL = 'https://www.cine4.be/';

const scrape = async (): Promise<Show[]> => {
	console.info('Scraping Ciné4...');

	const pageResponse = await axios.get(CINEMA_URL);
	if (pageResponse.statusText !== 'OK')
		throw new Error(`Request to ${CINEMA_URL} failed with code ${pageResponse.status}`);

	const pageHtml = pageResponse.data;
	const $page = cheerio.load(pageHtml);

	const $movies = $page('.afficheList').find('.affiche');

	const shows: Show[] = [];

	for (const el of $movies) {
		const url = $page(el).find('a').attr('href') as string;

		const movieResponse = await axios.get(url);
		if (movieResponse.statusText !== 'OK')
			throw new Error(`Request to ${CINEMA_URL} failed with code ${movieResponse.status}`);

		const movieHtml = movieResponse.data;
		const $movie = cheerio.load(movieHtml);

		let title = $movie('h1').text().trim();
		title = capitalizeTitle(title.split('(')[0]?.trim() || title);
		const poster = $movie('.affiche').attr('src') as string;
		const duration = formatDuration(
			$movie('.information').find("p:contains('Durée') > strong").text().trim()
		);

		const genres = normalizeGenres(
			$movie('.information')
				.find("p:contains('Genre') > span")
				.text()
				.split(',')
				.filter((genre) => genre !== '')
				.map((genre) => genre.trim().charAt(0).toUpperCase() + genre.trim().slice(1).toLowerCase())
		);

		$movie('.jour').each((i, el) => {
			const dateStr = $movie(el).find('.dateJour > p').text().trim().split(' ')[1];
			if (!dateStr) return;

			const [day, month] = dateStr.split('/');
			const date = createUTCDate(Number(month), Number(day));

			const schedules: Show['schedules'] = [];

			$movie(el)
				.find('.etiquetteFilm')
				.each((i, el) => {
					const time = $movie(el).find('.heureTicket').text().trim().replace(':', 'h');
					let version = $movie(el).find('.version').text().trim();
					version = version.startsWith('VO') ? (version = 'VO') : version;

					schedules.push({
						time,
						version,
						url,
						cinemaId: CINEMA_ID
					});
				});

			shows.push({
				priority: 1,
				date,
				movie: {
					slug: slugifyTitle(title),
					title,
					poster,
					duration,
					genres
				},
				schedules
			});
		});
	}

	return shows;
};

export default scrape;
