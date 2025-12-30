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
	import { currentFolder, currentWorkspace, workspaceFolders } from '$lib/stores';
	import { createFolder } from '$lib/services/dataService';

	let { open = $bindable(false), parentFolderId = $bindable<string | null>(null) } = $props();
	let folderName = $state('');
	let error = $state('');

	function handleClose() {
		open = false;
		folderName = '';
		error = '';
		parentFolderId = null;
	}

	function handleCreate() {
		if (!folderName.trim()) {
			error = 'Folder name is required';
			return;
		}

		if (!$currentWorkspace) {
			error = 'No workspace selected';
			return;
		}

		try {
			// Use parentFolderId if provided (from context menu), otherwise use currentFolder's id
			const effectiveParentId = parentFolderId || $currentFolder?.id || null;

			// Use dataService which properly manages all workspace data
			createFolder(effectiveParentId, folderName.trim());
			handleClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create folder';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleCreate();
		}
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>New Folder</DialogTitle>
			<DialogDescription>
				Create a new folder in {#if parentFolderId}
					the selected folder
				{:else}
					{$currentFolder?.name || 'root'}
				{/if}
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div>
				<label for="folder-name" class="mb-2 block text-sm font-medium">Folder Name</label>
				<Input
					id="folder-name"
					bind:value={folderName}
					placeholder="My Folder"
					onkeydown={handleKeydown}
					autofocus
				/>
			</div>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleCreate}>Create</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
