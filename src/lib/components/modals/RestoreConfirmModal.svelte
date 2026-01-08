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
	import { restoreFile, restoreFolder } from '$lib/services/dataService';
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

	async function handleRestore() {
		if (!item) return;

		loading = true;
		try {
			if (itemType === 'folder') {
				await restoreFolder(item.id);
			} else {
				await restoreFile(item.id);
			}
		} catch (err) {
			console.error('Restore failed:', err);
			loading = false;
		} finally {
			if (loading) handleClose();
		}
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Restore from Trash</DialogTitle>
			<DialogDescription>
				Are you sure you want to restore "{item?.name}"?
				{#if itemType === 'folder'}
					This will restore the folder and all files inside to their original location.
				{:else}
					This will restore the file to its original location.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button onclick={handleRestore} disabled={loading}>
				{#if loading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Restoring...
				{:else}
					Restore
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
