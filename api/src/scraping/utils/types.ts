export interface Show {
	priority: number;
	date: Date;
	movie: {
		slug: string;
		title: string;
		poster: string;
		duration: string;
		genres: string[];
	};
	schedules: Schedule[];
}

export interface Movie {
	priority: number;
	slug: string;
	title: string;
	poster: string;
	duration: string;
	genres: string[];
	shows: {
		date: Date;
		schedules: Schedule[];
	}[];
}

interface Schedule {
	time: string;
	version: string;
	url: string;
	cinemaId: string;
}
