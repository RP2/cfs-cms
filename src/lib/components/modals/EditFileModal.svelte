<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Combobox } from '$lib/components/ui/combobox';
	import { renameFile, replaceFileTags } from '$lib/services/dataService';
	import { workspaceTags } from '$lib/stores';
	import type { File } from '$lib/types';
	import { X } from '@lucide/svelte';

	let { open = $bindable(false), file = $bindable<File | null>(null) } = $props();

	let nameWithoutExtension = $state('');
	let extension = $state('');
	let selectedTagIds = $state<Set<string>>(new Set());
	let pendingTagNames = $state<string[]>([]);
	let error = $state('');

	$effect(() => {
		if (open && file) {
			const lastDotIndex = file.name.lastIndexOf('.');
			if (lastDotIndex > 0) {
				nameWithoutExtension = file.name.substring(0, lastDotIndex);
				extension = file.name.substring(lastDotIndex);
			} else {
				nameWithoutExtension = file.name;
				extension = '';
			}
			selectedTagIds = new Set(file.tagIds || []);
			pendingTagNames = [];
			error = '';
		}
	});

	function handleClose() {
		open = false;
		file = null;
		nameWithoutExtension = '';
		extension = '';
		selectedTagIds = new Set();
		pendingTagNames = [];
		error = '';
	}

	function handleSave() {
		if (!nameWithoutExtension.trim()) {
			error = 'Name is required';
			return;
		}

		if (!file) return;

		const newName = nameWithoutExtension.trim() + extension;

		try {
			renameFile(file.id, newName);
			const selectedNames = Array.from(selectedTagIds)
				.map((id) => tagMap.get(id)?.name)
				.filter(Boolean) as string[];
			replaceFileTags(file.id, file.workspaceId, [...selectedNames, ...pendingTagNames]);
			handleClose();
		} catch (e) {
			error = (e as Error).message;
		}
	}

	function normalizeTagName(name: string): string {
		return name.trim().toLowerCase();
	}

	function addPendingTag(name: string) {
		const normalized = normalizeTagName(name);
		if (!normalized) return;

		const existingActive = activeTags.find((tag) => normalizeTagName(tag.name) === normalized);
		if (existingActive) {
			const next = new Set(selectedTagIds);
			next.add(existingActive.id);
			selectedTagIds = next;
			return;
		}

		if (!pendingTagNames.some((n) => normalizeTagName(n) === normalized)) {
			pendingTagNames = [...pendingTagNames, name.trim()];
		}
	}

	function removePendingTag(name: string) {
		const normalized = normalizeTagName(name);
		pendingTagNames = pendingTagNames.filter((n) => normalizeTagName(n) !== normalized);
	}

	function removeSelectedTag(tagId: string) {
		const next = new Set(selectedTagIds);
		next.delete(tagId);
		selectedTagIds = next;
	}

	function handleSelectTag(event: CustomEvent<{ id: string; label: string }>) {
		const next = new Set(selectedTagIds);
		next.add(event.detail.id);
		selectedTagIds = next;
	}

	function handleCreateTag(label: string) {
		addPendingTag(label);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSave();
		}
	}

	let activeTags = $derived($workspaceTags.filter((tag) => !tag.deletedAt));
	let availableTags = $derived(activeTags.filter((tag) => !selectedTagIds.has(tag.id)));
	let tagMap = $derived(new Map(activeTags.map((tag) => [tag.id, tag])));

	function getTagClass(tagId: string): string {
		const tag = tagMap.get(tagId);
		if (!tag) return 'border-transparent bg-muted text-muted-foreground';
		const textColor = tag.color === 'muted' ? 'muted-foreground' : `${tag.color}-foreground`;
		return `border-transparent bg-${tag.color} text-${textColor}`;
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>Edit File</DialogTitle>
			<DialogDescription>Rename the file and manage tags</DialogDescription>
		</DialogHeader>
		<div class="space-y-6 py-4">
			<!-- File Name -->
			<div class="space-y-2">
				<Label for="file-name">File Name</Label>
				<div class="flex items-center gap-2">
					<Input
						id="file-name"
						bind:value={nameWithoutExtension}
						onkeydown={handleKeydown}
						class="flex-1"
						autofocus
					/>
					{#if extension}
						<span class="text-sm text-muted-foreground">{extension}</span>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">Extension cannot be changed</p>
			</div>

			<!-- Tags Section -->
			<div class="space-y-3">
				<Label>Tags</Label>
				<div class="space-y-2">
					{#if selectedTagIds.size > 0 || pendingTagNames.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each Array.from(selectedTagIds) as tagId (tagId)}
								{@const tag = tagMap.get(tagId)}
								<Badge class={getTagClass(tagId)}>
									{tag?.name ?? 'Tag'}
									<button type="button" class="ml-1" onclick={() => removeSelectedTag(tagId)}>
										<X class="h-3 w-3" />
									</button>
								</Badge>
							{/each}
							{#each pendingTagNames as tagName (tagName)}
								<Badge class="border-transparent bg-accent text-accent-foreground">
									{tagName}
									<button type="button" class="ml-1" onclick={() => removePendingTag(tagName)}>
										<X class="h-3 w-3" />
									</button>
								</Badge>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">No tags selected</p>
					{/if}

					<Combobox
						items={availableTags.map((tag) => ({ id: tag.id, label: tag.name }))}
						placeholder="Search or create tags"
						emptyMessage="No matches — press Enter to create"
						on:select={handleSelectTag}
						on:create={(event) => handleCreateTag(event.detail.label)}
					/>

					<p class="text-xs text-muted-foreground">
						Enter selects, Tab moves the highlight, new names are created automatically.
					</p>
				</div>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleSave}>Save Changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
