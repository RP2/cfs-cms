<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { createEventDispatcher } from 'svelte';

	type SearchItem = {
		value: string;
		label: string;
		description?: string;
	};

	const dispatch = createEventDispatcher<{
		select: { value: string; item?: SearchItem };
		create: { value: string };
	}>();

	let {
		items = $bindable<SearchItem[]>([]),
		value = $bindable(''),
		placeholder = $bindable('Search...'),
		searchPlaceholder = $bindable('Type to search...'),
		emptyMessage = $bindable('No matches found'),
		allowCreate = $bindable(true),
		buttonClass = $bindable('w-[240px] justify-between'),
		open = $bindable(false)
	} = $props();

	let triggerRef = $state<HTMLButtonElement | null>(null);
	let searchTerm = $state('');

	const selectedLabel = $derived(items.find((item) => item.value === value)?.label ?? '');

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus?.();
		});
	}

	function handleSelect(selectedValue: string) {
		value = selectedValue;
		const selectedItem = items.find((item) => item.value === selectedValue);
		dispatch('select', { value: selectedValue, item: selectedItem });
		closeAndFocusTrigger();
	}

	function handleCreate(label: string) {
		const trimmed = label.trim();
		if (!trimmed) return;
		dispatch('create', { value: trimmed });
		searchTerm = '';
		closeAndFocusTrigger();
	}

	const hasExactMatch = $derived(
		items.some((item) => item.label.toLowerCase() === searchTerm.trim().toLowerCase())
	);
	const showCreate = $derived(allowCreate && searchTerm.trim().length > 0 && !hasExactMatch);
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(buttonClass, 'justify-between')}
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{selectedLabel || placeholder}
				<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-70 p-0">
		<Command.Root>
			<Command.Input
				placeholder={searchPlaceholder}
				bind:value={searchTerm}
				onkeydown={(event) => {
					if (event.key === 'Enter' && showCreate) {
						event.preventDefault();
						handleCreate(searchTerm);
					}
				}}
			/>
			<Command.List>
				<Command.Empty>{emptyMessage}</Command.Empty>
				<Command.Group>
					{#each items as item}
						<Command.Item value={item.value} onSelect={() => handleSelect(item.value)}>
							<CheckIcon class={cn('me-2 size-4', value !== item.value && 'text-transparent')} />
							<div class="flex flex-col">
								<span>{item.label}</span>
								{#if item.description}
									<span class="text-xs text-muted-foreground">{item.description}</span>
								{/if}
							</div>
						</Command.Item>
					{/each}

					{#if showCreate}
						<Command.Item value={`create-${searchTerm}`} onSelect={() => handleCreate(searchTerm)}>
							<CheckIcon class="me-2 size-4 text-transparent" />
							Create "{searchTerm}"
						</Command.Item>
					{/if}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
