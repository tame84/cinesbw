<script lang="ts">
	import type { Movie } from '$lib/types.js';
	import MovieCard from './movie-card.svelte';

	interface Props {
		movies: Movie[];
	}

	let { movies }: Props = $props();

	let searchQuery = $state('');

	const moviesToShow = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return movies;
		return movies.filter((m: Movie) => m.title.toLowerCase().includes(q));
	});
</script>

<div class="mx-auto flex w-full max-w-[1400px] gap-8 rounded-lg bg-white p-8 shadow-sm">
	<input
		type="text"
		bind:value={searchQuery}
		id="searchQuery"
		placeholder="Rechercher parmis les résultats"
		class="w-full rounded-lg border border-black/15 bg-gray-50 p-3"
	/>
</div>
{#if moviesToShow.length > 0}
	{#each moviesToShow as movie (movie.id)}
		<MovieCard {movie} />
	{/each}
{:else}
	<p class="text-center text-black/60">Aucun résultat n'a été trouvé.</p>
{/if}
