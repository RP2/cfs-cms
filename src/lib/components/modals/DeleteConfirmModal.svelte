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
	import { Loader2 } from '@lucide/svelte';

	let {
		open = $bindable(false),
		item = $bindable<Folder | File | null>(null),
		itemType = $bindable<'folder' | 'file'>('folder')
	} = $props();

	let loading = $state(false);

	function handleClose() {
		open = false;
		item = null;
		loading = false;
	}

	async function handleDelete() {
		if (!item) return;

		loading = true;
		try {
			if (itemType === 'folder') {
				await deleteFolder(item.id);
			} else {
				await deleteFile(item.id);
			}
			handleClose();
		} catch (err) {
			console.error('Delete failed:', err);
			loading = false;
		}
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
			<Button variant="outline" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={loading}>
				{#if loading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Moving to trash...
				{:else}
					Move to Trash
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
