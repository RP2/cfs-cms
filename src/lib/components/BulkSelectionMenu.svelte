<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { fly } from 'svelte/transition';
	import {
		X,
		Trash2,
		RotateCcw,
		FolderUp,
		Tag,
		Copy,
		Download,
		ListChecks,
		CircleCheckBig
	} from '@lucide/svelte';

	interface Props {
		selectedCount: number;
		isTrashView: boolean;
		allVisibleSelected: boolean;
		onRestore: () => void;
		onTrash: () => void;
		onCopy: () => void;
		onMove: () => void;
		onTag: () => void;
		onDownload: () => void;
		onSelectAll: () => void;
		onClear: () => void;
	}

	let {
		selectedCount,
		isTrashView,
		allVisibleSelected,
		onRestore,
		onTrash,
		onCopy,
		onMove,
		onTag,
		onDownload,
		onSelectAll,
		onClear
	}: Props = $props();
</script>

{#if selectedCount > 0}
	<div
		in:fly={{ y: 20, duration: 200 }}
		out:fly={{ y: 20, duration: 150 }}
		class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-full flex-col gap-3 rounded-t-2xl border border-accent bg-accent/95 p-4 shadow-lg backdrop-blur-sm md:right-6 md:bottom-6 md:left-auto md:max-w-fit md:flex-row md:rounded-lg"
	>
		<span class="text-sm font-medium text-accent-foreground md:flex md:items-center"
			>{selectedCount} file{selectedCount !== 1 ? 's' : ''} selected</span
		>
		<div class="grid grid-cols-4 gap-2 md:flex md:flex-wrap">
			{#if isTrashView}
				<Button
					variant="ghost"
					size="sm"
					class="h-10 flex-col gap-1 text-accent-foreground hover:bg-accent/80 md:h-8 md:flex-row md:px-2"
					onclick={onRestore}
				>
					<RotateCcw class="h-4 w-4" />
					<span class="text-xs md:text-sm">Restore</span>
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
					onclick={onTrash}
				>
					<Trash2 class="h-4 w-4" />
					<span class="text-xs md:text-sm">Trash</span>
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
				onclick={onCopy}
			>
				<Copy class="h-4 w-4" />
				<span class="text-xs md:text-sm">Copy</span>
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
				onclick={onMove}
			>
				<FolderUp class="h-4 w-4" />
				<span class="text-xs md:text-sm">Move</span>
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
				onclick={onTag}
			>
				<Tag class="h-4 w-4" />
				<span class="text-xs md:text-sm">Tag</span>
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
				onclick={onDownload}
			>
				<Download class="h-4 w-4" />
				<span class="text-xs md:text-sm">Download</span>
			</Button>
			{#if allVisibleSelected}
				<Button
					variant="ghost"
					size="sm"
					class="h-10 flex-col gap-1 text-accent-foreground md:h-8 md:flex-row md:px-2"
					disabled
				>
					<CircleCheckBig class="h-4 w-4" />
					<span class="text-xs md:text-sm">All Selected</span>
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
					onclick={onSelectAll}
				>
					<ListChecks class="h-4 w-4" />
					<span class="text-xs md:text-sm">Select All</span>
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-10 flex-col gap-1 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background md:h-8 md:flex-row md:px-2"
				onclick={onClear}
			>
				<X class="h-4 w-4" />
				<span class="text-xs md:text-sm">Clear</span>
			</Button>
		</div>
	</div>
{/if}
