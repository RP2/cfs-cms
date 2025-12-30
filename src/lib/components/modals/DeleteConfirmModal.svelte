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
	import { deleteFolder, deleteFile } from '$lib/services/dataService';
	import type { Folder, File } from '$lib/types';

	let {
		open = $bindable(false),
		item = $bindable<Folder | File | null>(null),
		itemType = $bindable<'folder' | 'file'>('folder')
	} = $props();

	function handleClose() {
		open = false;
		item = null;
	}

	function handleDelete() {
		if (!item) return;

		if (itemType === 'folder') {
			deleteFolder(item.id);
		} else {
			deleteFile(item.id);
		}

		handleClose();
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Move to Trash</DialogTitle>
			<DialogDescription>
				Are you sure you want to move "{item?.name}" to the trash?
				{#if itemType === 'folder'}
					This also moves all files inside. Items can be restored from Trash for 30 days.
				{:else}
					Items can be restored from Trash for 30 days.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Move to Trash</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
