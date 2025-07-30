<script lang="ts">
	import Checkbox from './checkbox.svelte';

	let { genres } = $props();
</script>

<div>
	<header class="mb-3 flex items-center justify-between">
		<h3 class="text-2xl font-bold">Genres</h3>
	</header>
	<div class="flex flex-wrap gap-2">
		{#each genres as genre, i}
			<Checkbox name={'genre'} id="genre-{i}" value={genre} text={genre} />
		{/each}
	</div>
</div>
