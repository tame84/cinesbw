import type { Cinema, Movie } from '$lib/types.js';

export const load = async ({ fetch }) => {
	const showsDates: Promise<string[]> = fetch(
		'https://www.api.cinesbw.dino-valentini.be/shows'
	).then((r) => r.json());
	const cinemas: Promise<Cinema[]> = fetch(
		'https://www.api.cinesbw.dino-valentini.be/cinemas'
	).then((r) => r.json());
	const genres: Promise<string[]> = fetch('https://www.api.cinesbw.dino-valentini.be/genres').then(
		(r) => r.json()
	);
	const movies: Promise<Movie[]> = fetch('https://www.api.cinesbw.dino-valentini.be/movies').then(
		(r) => r.json()
	);

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
