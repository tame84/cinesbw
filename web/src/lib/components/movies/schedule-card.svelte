<script lang="ts">
	import type { Schedule } from '$lib/types.js';

	interface Props {
		schedule: Schedule;
	}

	let { schedule }: Props = $props();
</script>

<a
	href={schedule.url}
	target="_blank"
	class="schedule space-y-2 rounded-lg border border-black/15 text-center duration-100 hover:border-primary-500 hover:bg-primary-500/10"
>
	<div class="relative mx-auto w-fit">
		<p class="text-2xl font-bold text-primary-500">
			{schedule.time}
		</p>
		<span
			class="absolute -top-4 right-0 z-5 inline-block translate-x-4/6 rounded-lg bg-gray-200 px-1.5 py-0.5 text-sm text-black/80"
			>{schedule.version}</span
		>
	</div>
	<p class="text-sm text-black/80">{schedule.cinema.name}</p>
</a>
