<script lang="ts">
	import type { Movie } from '$lib/types.js';
	import ScheduleCard from './schedule-card.svelte';

	interface Props {
		movie: Movie;
	}

	let { movie }: Props = $props();
</script>

<div
	class="mx-auto flex w-full max-w-[1400px] gap-8 rounded-lg bg-white p-8 shadow-sm max-[500px]:flex-col"
>
	<div>
		<img
			src={movie.poster}
			alt={movie.title}
			width="200"
			loading="lazy"
			class="rounded-lg max-[500px]:w-full"
		/>
	</div>
	<div class="w-full">
		<h2 class="mb-3 text-2xl font-bold capitalize">{movie.title}</h2>
		<div class="mb-8 space-x-2">
			<span class="inline-block rounded-full bg-black/10 px-3 py-1.5 text-sm text-black/80"
				>{movie.duration}</span
			>
			<span class="text-sm text-black/80">{movie.genres.join(', ')}</span>
		</div>
		<div>
			<h3 class="mb-4 text-lg font-semibold text-black/80">Séances disponibles</h3>
			<div class="schedules">
				{#each movie.schedules as schedule, i (`${schedule.cinema}-${schedule.time}-${schedule.version}-${i}`)}
					<ScheduleCard {schedule} />
				{/each}
			</div>
		</div>
	</div>
</div>
