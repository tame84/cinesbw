<script lang="ts">
	import Checkbox from './checkbox.svelte';

	let { cinemas } = $props();
</script>

<div>
	<header class="mb-3 flex items-center justify-between">
		<h3 class="text-2xl font-bold">Cinémas</h3>
	</header>
	<div class="flex flex-wrap gap-2">
		{#each cinemas as cinema, i}
			<Checkbox name={'cinema'} id="cinema-{i}" value={cinema.id} text={cinema.name} />
		{/each}
	</div>
</div>
