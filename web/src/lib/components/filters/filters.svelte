<script lang="ts">
	import { enhance } from '$app/forms';
	import Cinemas from './cinemas.svelte';
	import Dates from './dates.svelte';
	import Genres from './genres.svelte';
	import Versions from './versions.svelte';

	interface Props {
		dates: string[];
		cinemas: {
			name: string;
			id: string;
		}[];
		genres: string[];
		setLoading: (loading: boolean) => void;
	}

	let { dates, cinemas, genres, setLoading }: Props = $props();

	// svelte-ignore non_reactive_update
	let formEl: HTMLFormElement;
	let currentDate: string = $state(new Date().toISOString().split('T')[0]);

	const handleReset = () => {
		if (currentDate) {
			const radio = formEl.querySelector<HTMLInputElement>(
				`input[name="date"][value="${currentDate}"]`
			);
			const radios = formEl.querySelectorAll<HTMLInputElement>('input[name="date"]');
			if (radio) {
				radios.forEach((r) => (r.defaultChecked = false));
				radio.defaultChecked = true;
			}
		}
	};

	const handleDateChange = (value: string) => {
		currentDate = value.split('T')[0];
	};
</script>

<form
	use:enhance={({ action }) => {
		setLoading(true);

		if (action.search === '?/reset') {
			return async ({ update }) => {
				update();
			};
		}

		return async ({ update }) => {
			update({ reset: false });
		};
	}}
	method="post"
	action="?/search"
	bind:this={formEl}
	onreset={handleReset}
	class="space-y-8"
>
	<Dates {dates} changeDate={handleDateChange} form={formEl} />
	<!-- <Cinemas {cinemas} /> -->
	<!-- <Versions /> -->
	<!-- <Genres {genres} /> -->
	<div>
		<button
			type="submit"
			formaction="?/reset"
			class="cursor-pointer rounded-lg border border-black/15 px-6 py-3 font-medium text-black duration-200 hover:bg-gray-200"
			>Effacer les filtres</button
		>
	</div>
</form>
