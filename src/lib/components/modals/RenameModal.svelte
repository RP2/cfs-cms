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
	import { renameFolder, renameFile } from '$lib/services/dataService';
	import type { Folder, File } from '$lib/types';

	let {
		open = $bindable(false),
		item = $bindable<Folder | File | null>(null),
		itemType = $bindable<'folder' | 'file'>('folder')
	} = $props();

	let newName = $state('');
	let error = $state('');

	$effect(() => {
		if (open && item) {
			newName = item.name;
			error = '';
		}
	});

	function handleClose() {
		open = false;
		item = null;
		newName = '';
		error = '';
	}

	function handleRename() {
		if (!newName.trim()) {
			error = 'Name is required';
			return;
		}

		if (!item) return;

		try {
			if (itemType === 'folder') {
				renameFolder(item.id, newName);
			} else {
				renameFile(item.id, newName);
			}
			handleClose();
		} catch (e) {
			error = (e as Error).message;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleRename();
		}
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Rename {itemType === 'folder' ? 'Folder' : 'File'}</DialogTitle>
			<DialogDescription>Enter a new name for this {itemType}</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div>
				<label for="new-name" class="mb-2 block text-sm font-medium">Name</label>
				<Input id="new-name" bind:value={newName} onkeydown={handleKeydown} autofocus />
			</div>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleRename}>Rename</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
