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
	import { mockFolders, mockFiles } from '$lib/data/mock';
	import { workspaceFolders, currentFiles } from '$lib/stores';
	import type { Folder, File } from '$lib/types';

	export let open = false;
	export let item: (Folder | File) | null = null;
	export let itemType: 'folder' | 'file' = 'folder';

	let newName = '';
	let error = '';

	$: if (open && item) {
		newName = item.name;
		error = '';
	}

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

		if (itemType === 'folder') {
			const folder = item as Folder;
			if (newName === folder.name) {
				handleClose();
				return;
			}

			// Update folder
			folder.name = newName.trim();
			folder.updatedAt = new Date();
			workspaceFolders.set([...mockFolders.filter((f) => !f.deletedAt)]);
		} else {
			const file = item as File;
			if (newName === file.name) {
				handleClose();
				return;
			}

			// Update file
			file.name = newName.trim();
			file.updatedAt = new Date();
			currentFiles.set([...mockFiles.filter((f) => !f.deletedAt)]);
		}

		handleClose();
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
