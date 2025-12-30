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
	import { mockFolders, mockFiles, getFilesForFolder } from '$lib/data/mock';
	import { workspaceFolders, currentFiles } from '$lib/stores';
	import type { Folder, File } from '$lib/types';

	export let open = false;
	export let item: (Folder | File) | null = null;
	export let itemType: 'folder' | 'file' = 'folder';

	function handleClose() {
		open = false;
		item = null;
	}

	function handleDelete() {
		if (!item) return;

		if (itemType === 'folder') {
			const folder = item as Folder;
			// Soft delete folder
			folder.deletedAt = new Date();

			// Also soft delete all files in this folder
			const filesInFolder = getFilesForFolder(folder.id);
			filesInFolder.forEach((file) => {
				file.deletedAt = new Date();
			});

			workspaceFolders.set([...mockFolders.filter((f) => !f.deletedAt)]);
			currentFiles.set([...mockFiles.filter((f) => !f.deletedAt)]);
		} else {
			const file = item as File;
			// Soft delete file
			file.deletedAt = new Date();
			currentFiles.set([...mockFiles.filter((f) => !f.deletedAt)]);
		}

		handleClose();
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete {itemType === 'folder' ? 'Folder' : 'File'}</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{item?.name}"?
				{#if itemType === 'folder'}
					This will also delete all files inside this folder. This action cannot be undone.
				{:else}
					This action cannot be undone.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Delete</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
