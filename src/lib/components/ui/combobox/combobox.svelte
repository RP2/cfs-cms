<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { createEventDispatcher } from 'svelte';

	type Item = { id: string; label: string };

	const dispatch = createEventDispatcher<{
		select: Item;
		create: { label: string };
	}>();

	let {
		items = $bindable<Item[]>([]),
		placeholder = $bindable('Search...'),
		emptyMessage = $bindable('No results'),
		openOnFocus = $bindable(true),
		clearOnSelect = $bindable(true),
		clearOnCreate = $bindable(true)
	} = $props();

	let inputValue = $state('');
	let isOpen = $state(false);
	let highlightedIndex = $state(0);

	let filteredItems = $derived(
		items.filter((item) => item.label.toLowerCase().includes(inputValue.trim().toLowerCase()))
	);

	$effect(() => {
		// Reset highlight when list changes
		highlightedIndex = 0;
	});

	function openList() {
		if (!isOpen) {
			isOpen = true;
		}
	}

	function closeList() {
		isOpen = false;
	}

	function selectItem(item: Item) {
		dispatch('select', item);
		if (clearOnSelect) {
			inputValue = '';
		}
		highlightedIndex = 0;
		closeList();
	}

	function createItem(label: string) {
		const value = label.trim();
		if (!value) return;
		dispatch('create', { label: value });
		if (clearOnCreate) {
			inputValue = '';
		}
		highlightedIndex = 0;
		closeList();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			openList();
			highlightedIndex = (highlightedIndex + 1) % Math.max(filteredItems.length, 1);
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			openList();
			highlightedIndex =
				(highlightedIndex - 1 + Math.max(filteredItems.length, 1)) %
				Math.max(filteredItems.length, 1);
			return;
		}
		if (event.key === 'Tab' && isOpen && filteredItems.length > 0) {
			event.preventDefault();
			highlightedIndex = (highlightedIndex + 1) % filteredItems.length;
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			if (isOpen && filteredItems.length > 0) {
				const item = filteredItems[highlightedIndex] ?? filteredItems[0];
				if (item) {
					selectItem(item);
					return;
				}
			}
			createItem(inputValue);
			return;
		}
		if (event.key === 'Escape') {
			closeList();
			return;
		}
	}

	function handleFocus() {
		if (openOnFocus) {
			openList();
		}
	}

	function handleBlur() {
		// Delay closing to allow option click
		setTimeout(() => closeList(), 100);
	}
</script>

<div class="relative">
	<Input
		{placeholder}
		bind:value={inputValue}
		oninput={openList}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		class="w-full"
	/>

	{#if isOpen}
		<div
			class="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-card text-sm shadow-md"
		>
			{#if filteredItems.length > 0}
				<div class="max-h-60 overflow-y-auto">
					{#each filteredItems as item, index}
						<button
							type="button"
							class={`flex w-full items-center px-3 py-2 text-left transition hover:bg-muted ${
								highlightedIndex === index ? 'bg-muted' : ''
							}`}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => selectItem(item)}
						>
							{item.label}
						</button>
					{/each}
				</div>
			{:else}
				<div class="px-3 py-2 text-muted-foreground">{emptyMessage}</div>
			{/if}
		</div>
	{/if}
</div>
