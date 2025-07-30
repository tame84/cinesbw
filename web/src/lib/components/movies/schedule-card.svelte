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
	class="schedule hover:border-primary-500 hover:bg-primary-500/10 space-y-2 rounded-lg border border-black/15 text-center duration-100"
>
	<div class="relative mx-auto w-fit">
		<p class="text-primary-500 text-2xl font-bold">
			{schedule.time}
		</p>
		<span
			class="z-5 translate-x-4/6 absolute -top-4 right-0 inline-block rounded-lg bg-gray-200 px-1.5 py-0.5 text-sm text-black/80"
			>{schedule.version}</span
		>
	</div>
	<p class="text-sm text-black/80">{schedule.cinema.name}</p>
</a>
