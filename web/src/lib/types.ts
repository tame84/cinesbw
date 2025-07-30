export interface Movie {
	id: string;
	slug: string;
	title: string;
	poster: string;
	duration: string;
	genres: string[];
	schedules: Schedule[];
}

export interface Schedule {
	cinema: {
		name: string;
	};
	time: string;
	url: string;
	version: string;
}

export interface Cinema {
	name: string;
	id: string;
}
