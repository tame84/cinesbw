<script lang="ts">
	import Filters from '$lib/components/filters/filters.svelte';
	import Movies from '$lib/components/movies/movies.svelte';

	let { data, form } = $props();

	let isLoading = $state(false);

	const setLoading = (loading: boolean): void => {
		isLoading = loading;
	};

	$effect(() => {
		if (form) isLoading = false;
	});
</script>

<header class="bg-gradient-to-br from-primary-900 to-primary-500 px-4 py-16 text-center">
	<p class="mb-2 text-5xl font-bold text-white">CinésBW</p>
	<h1 class="text-xl text-white/75">Toute la programmation des cinémas du Brabant Wallon</h1>
</header>

<div class="mb-16 border-b border-black/15 bg-white px-4 py-12 shadow-sm">
	<div class="mx-auto max-w-[1400px]">
		<Filters dates={data.showsDates} cinemas={data.cinemas} genres={data.genres} {setLoading} />
	</div>
</div>

<div class="mb-16 space-y-8 px-4">
	{#if isLoading}
		<p class="text-center text-black/60">Chargement en cours...</p>
	{:else}
		<Movies movies={form?.movies || data.movies} />
	{/if}
</div>

<footer class="bg-gradient-to-br from-primary-500 to-primary-900 p-8 text-center">
	<p class="text-white">
		Réalisé par <a href="https://www.dino-valentini.be/" target="_blank" class="font-medium"
			>Dino Valentini
		</a>
	</p>
</footer>
