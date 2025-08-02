import type { Cinema, Movie } from '$lib/types.js';

export const load = async ({ fetch }) => {
	const [showsDates, cinemas, genres, movies]: [string[], Cinema[], string[], Movie[]] =
		await Promise.all([
			fetch('https://www.api.cinesbw.dino-valentini.be/shows').then((res) => res.json()),
			fetch('https://www.api.cinesbw.dino-valentini.be/cinemas').then((res) => res.json()),
			fetch('https://www.api.cinesbw.dino-valentini.be/genres').then((res) => res.json()),
			fetch('https://www.api.cinesbw.dino-valentini.be/movies').then((res) => res.json())
		]);

	return { showsDates, cinemas, genres, movies };
};

export const actions = {
	search: async ({ request, fetch }) => {
		const data = await request.formData();
		const date = data.get('date');
		const cinemas = data.getAll('cinema').join(',');
		const versions = data.getAll('version').join(',');
		const genres = data.getAll('genre').join(',');

		const movies: Movie[] = await fetch(
			`https://www.api.cinesbw.dino-valentini.be/movies?date=${date}&cinema=${cinemas}&version=${versions}&genre=${genres}`
		).then((res) => res.json());

		return { movies };
	},
	reset: async ({ request, fetch }) => {
		const data = await request.formData();
		const date = data.get('date');

		const movies: Movie[] = await fetch(
			`https://www.api.cinesbw.dino-valentini.be/movies?date=${date}`
		).then((res) => res.json());

		return { movies };
	}
};
