<script lang="ts">
	import Checkbox from './checkbox.svelte';

	const versions = ['VO', 'VF', 'NV'];
</script>

<div>
	<header class="mb-3 flex items-center justify-between">
		<g2 class="text-2xl font-bold">Langues</g2>
	</header>
	<div class="flex flex-wrap gap-2">
		{#each versions as version, i}
			<Checkbox name={'version'} id="version-{i}" value={version} text={version} />
		{/each}
	</div>
</div>
