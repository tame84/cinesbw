<script lang="ts">
	let { name, id, value, text } = $props();

	let inpulEl: HTMLInputElement;

	const handleClick = () => {
		inpulEl.checked = !inpulEl.checked;
	};
</script>

<button
	type="submit"
	onclick={handleClick}
	class="flex w-fit items-center justify-center select-none"
>
	<input bind:this={inpulEl} type="checkbox" {name} {id} {value} class="peer hidden" />
	<label
		for={id}
		class="cursor-pointer rounded-full border border-black/15 px-6 py-3 font-medium peer-checked:bg-primary-500 peer-checked:text-white peer-focus-visible:bg-primary-500"
	>
		{text}
	</label>
</button>
