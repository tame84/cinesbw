<script lang="ts">
	import Date from './date.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		dates: string[];
		changeDate: (dateStr: string) => void;
	}

	let { dates, changeDate }: Props = $props();

	let currentIndex = $state(0);
	const totalItems = dates.length - 1;
	let carouselElement: HTMLDivElement;
	let isDragging = $state(false);
	let startX = $state(0) as number;
	let scrollLeft = $state(0) as number;

	const goPrev = () => {
		if (currentIndex > 0) {
			currentIndex--;
			scrollToCurrent();
			changeDate(dates[currentIndex]);
		}
	};

	const goNext = () => {
		if (currentIndex < totalItems) {
			currentIndex++;
			scrollToCurrent();
			changeDate(dates[currentIndex]);
		}
	};

	const scrollToCurrent = () => {
		const item = carouselElement.querySelector<HTMLDivElement>(`[data-index="${currentIndex}"]`);
		if (item) {
			carouselElement.scrollTo({
				left: (item.offsetWidth + 16) * currentIndex,
				behavior: 'smooth'
			});
		}
	};

	const onMouseDown = (e: MouseEvent) => {
		isDragging = true;
		startX = e.pageX - carouselElement.offsetLeft;
		scrollLeft = carouselElement.scrollLeft;
		carouselElement.classList.add('cursor-grabbing');
	};

	const onMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;
		e.preventDefault();
		const x = e.pageX - carouselElement.offsetLeft;
		const walk = (x - startX) * 1;
		carouselElement.scrollLeft = scrollLeft - walk;
	};

	const onMouseUp = () => {
		isDragging = false;
		carouselElement.classList.remove('cursor-grabbing');
	};

	const onTouchStart = (e: TouchEvent) => {
		isDragging = true;
		startX = e.touches[0].pageX - carouselElement.offsetLeft;
		scrollLeft = carouselElement.scrollLeft;
	};

	const onTouchMove = (e: TouchEvent) => {
		if (!isDragging) return;
		const x = e.touches[0].pageX - carouselElement.offsetLeft;
		const walk = (x - startX) * 1;
		carouselElement.scrollLeft = scrollLeft - walk;
	};

	const onTouchEnd = () => {
		isDragging = false;
	};

	const setCurrentIndex = (i: number) => {
		currentIndex = i;
		scrollToCurrent();
	};
</script>

<div>
	<header class="mb-3 flex items-center justify-between">
		<h3 class="text-2xl font-bold">Dates</h3>
	</header>
	<div class="flex items-center gap-4">
		<button
			type="button"
			onclick={goPrev}
			disabled={currentIndex <= 0}
			class="z-10 cursor-pointer rounded-full bg-white p-2 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
		>
			<ChevronLeft />
		</button>
		<div
			bind:this={carouselElement}
			role="slider"
			aria-valuenow={currentIndex}
			tabindex="-1"
			onmousedown={onMouseDown}
			onmousemove={onMouseMove}
			onmouseup={onMouseUp}
			onmouseleave={onMouseUp}
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
			class="flex cursor-grab gap-4 overflow-hidden"
		>
			{#each dates as date, i (i)}
				<div data-index={i}>
					<Date
						dateStr={date}
						isSelected={currentIndex === i}
						setCurrentIndex={() => setCurrentIndex(i)}
						{changeDate}
					/>
				</div>
			{/each}
		</div>
		<button
			type="button"
			onclick={goNext}
			disabled={currentIndex >= totalItems}
			class="z-10 cursor-pointer rounded-full bg-white p-2 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
		>
			<ChevronRight />
		</button>
	</div>
</div>
