export const createUTCDate = (month: number, day: number): Date => {
	const year = new Date().getFullYear();
	return new Date(Date.UTC(year, month - 1, day));
};

export const formatShowTime = (isoDate: string): string => {
	const date = new Date(isoDate);

	const formatter = new Intl.DateTimeFormat('fr-BE', {
		timeZone: 'Europe/Brussels',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	const time = formatter.format(date);

	return time.replace(':', 'h');
};
