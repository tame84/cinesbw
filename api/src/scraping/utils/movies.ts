export const slugifyTitle = (title: string): string => {
    const slug = title
        .normalize("NFD")
        .trim()
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");

    return slug;
};

export const capitalizeTitle = (title: string): string => {
    return title
        .toLowerCase()
        .split(" ")
        .map((word) => {
            if (word.length === 0) return "";
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
};

export const formatDuration = (duration: string): string => {
    if (!duration) {
        return "";
    }

    let [hours, mins] = duration.split("h");
    if (!hours) return "";
    if (!mins) mins = "";

    hours = parseInt(hours, 10).toString();
    mins = mins.padStart(2, "0");

    return `${hours}h${mins}`;
};

export const formatDurationMintuesToString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = (minutes % 60).toString().padStart(2, "0");

    return `${hours}h${mins}`;
};

export const normalizeGenres = (genres: string[]): string[] => {
    if (!genres || genres.length === 0) return [];

    const genresMap: Record<string, string> = {
        famille: "Familial",
        "film familial": "Familial",
        "epouvante-horreur": "Horreur",
        "film d'animation": "Animation",
        "film animation": "Animation",
        "dessin animé": "Animation",
        "famille/kids": "Familial",
        "drame historique": "Drame",
        fantastiques: "Fantastique",
        "science fiction": "Science-fiction",
        aventures: "Aventure",
    };

    return genres.map((genre) => {
        const key = genre.trim().toLowerCase();
        return genresMap[key] || genre;
    });
};

export const normalizeEventName = (eventName: string): string => {
    if (!eventName) return "";

    const eventNameMap: Record<string, string> = {
        reprise: "Classics",
        "seniors at the movies": "Seniors",
        "théâtre au cinéma": "NT Live",
    };

    const key = eventName.trim().toLocaleLowerCase();
    return eventNameMap[key] || eventName;
};
