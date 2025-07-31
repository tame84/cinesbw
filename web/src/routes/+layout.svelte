<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>CinésBW - Toute la programmation des cinémas du Brabant Wallon</title>
	<meta
		name="description"
		content="Retrouvez tout les films projetés dans les différents cinémas du Brabant Wallon."
	/>
	<link rel="canonical" href="https://cinesbw.vercel.app/" />
</svelte:head>

{@render children()}
