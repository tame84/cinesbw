<script lang="ts">
	import Checkbox from './checkbox.svelte';
	import type { Cinema } from '$lib/types';

	interface Props {
		cinemas: Cinema[];
	}

	let { cinemas }: Props = $props();
</script>

<div>
	<header class="mb-3 flex items-center justify-between">
		<h2 class="text-2xl font-bold">Cinémas</h2>
	</header>
	<div class="flex flex-wrap gap-2">
		{#each cinemas as cinema, i (cinema.id)}
			<Checkbox name="cinema" id="cinema-{i}" value={cinema.id} text={cinema.name} />
		{/each}
	</div>
</div>
