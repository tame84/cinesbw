<script lang="ts">
	let { name, id, value, text } = $props();

	let inpulEl: HTMLInputElement;

	const handleClick = () => {
		inpulEl.checked = !inpulEl.checked;
	};
</script>

<button
	type="button"
	onclick={handleClick}
	class="flex w-fit select-none items-center justify-center"
>
	<input bind:this={inpulEl} type="checkbox" {name} {id} {value} class="peer hidden" />
	<label
		for={id}
		class="peer-checked:bg-primary-500 peer-focus-visible:bg-primary-500 cursor-pointer rounded-full border border-black/15 px-6 py-3 font-medium peer-checked:text-white"
	>
		{text}
	</label>
</button>
