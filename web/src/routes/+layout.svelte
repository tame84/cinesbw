<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>CinésBW - Toute la programmation des cinémas du Brabant Wallon</title>
	<meta
		name="description"
		content="Retrouvez tous les films projetés dans les différents cinémas du Brabant Wallon."
	/>
	<meta name="robots" content="noindex follow" />
	<link rel="canonical" href="https://cinesbw.vercel.app/" />
	<link
		rel="preload"
		href="/fonts/inter-variable.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

{@render children()}
