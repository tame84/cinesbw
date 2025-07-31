<script lang="ts">
	interface Props {
		dateStr: string;
		isSelected: boolean;
		setCurrentIndex: () => void;
		changeDate: (dateStr: string) => void;
	}

	let { dateStr, isSelected, setCurrentIndex, changeDate }: Props = $props();

	const date = new Date(dateStr);

	const formatterDay = new Intl.DateTimeFormat('fr-BE', { weekday: 'long' });
	const formatterMonth = new Intl.DateTimeFormat('fr-BE', { month: 'long' });

	const dayName = $derived(formatterDay.format(date));
	const dayNumber = $derived(date.getDate());
	const monthName = $derived(formatterMonth.format(date));

	const handleClick = () => {
		setCurrentIndex();
		changeDate(dateStr);
	};
</script>

<div class="size-44 min-w-[176px] select-none max-[500px]:size-20 max-[500px]:min-w-[120px]">
	<button type="submit" onclick={handleClick} class="contents">
		<input
			type="radio"
			name="date"
			id={date.toISOString().split('T')[0]}
			value={date.toISOString().split('T')[0]}
			checked={isSelected}
			aria-labelledby={date.toDateString().split('T')[0]}
			class="peer hidden"
		/>
		<label
			for={date.toISOString().split('T')[0]}
			class="flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border border-black/15 duration-100 peer-checked:bg-primary-500 peer-checked:text-white"
		>
			<p class="capitalize max-[500px]:text-sm">{dayName}</p>
			<p class="text-3xl font-bold max-[500px]:text-xl">{dayNumber}</p>
			<p class="capitalize max-[500px]:hidden">{monthName}</p>
		</label>
	</button>
</div>
