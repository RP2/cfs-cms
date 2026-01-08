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
	import { renameFile, renameFolder } from '$lib/services/dataService';
	import type { Folder, File } from '$lib/types';
	import { Loader2 } from '@lucide/svelte';

	let {
		open = $bindable(false),
		item = $bindable<Folder | File | null>(null),
		itemType = $bindable<'folder' | 'file'>('folder')
	} = $props();

	let newName = $state('');
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (open && item) {
			newName = item.name;
			error = '';
			loading = false;
		}
	});

	function handleClose() {
		open = false;
		item = null;
		newName = '';
		error = '';
		loading = false;
	}

	async function handleRename() {
		if (!newName.trim()) {
			error = 'Name is required';
			return;
		}

		if (!item) return;

		loading = true;
		error = '';
		try {
			if (itemType === 'folder') {
				await renameFolder(item.id, newName.trim());
			} else {
				await renameFile(item.id, newName.trim());
			}
		} catch (e) {
			error = (e as Error).message;
			loading = false;
		} finally {
			if (loading) handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !loading) {
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
			<Button variant="outline" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button onclick={handleRename} disabled={!newName.trim() || loading}>
				{#if loading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Renaming...
				{:else}
					Rename
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
