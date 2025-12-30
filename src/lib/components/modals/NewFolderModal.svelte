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
	import { mockFolders } from '$lib/data/mock';

	let { open = $bindable(false) } = $props();
	let folderName = $state('');
	let error = $state('');

	function handleClose() {
		open = false;
		folderName = '';
		error = '';
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

		// Check if folder name already exists at this level
		const parentId = $currentFolder?.id || null;
		const exists = mockFolders.some(
			(f) =>
				f.workspaceId === $currentWorkspace!.id &&
				f.parentId === parentId &&
				f.name === folderName.trim()
		);

		if (exists) {
			error = 'A folder with this name already exists';
			return;
		}

		// Create new folder
		const newFolder = {
			id: `folder_${Date.now()}`,
			workspaceId: $currentWorkspace.id,
			parentId: parentId,
			name: folderName.trim(),
			description: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null
		};

		mockFolders.push(newFolder);
		workspaceFolders.set([
			...mockFolders.filter((f) => f.workspaceId === $currentWorkspace!.id && !f.deletedAt)
		]);

		handleClose();
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
			<DialogDescription>Create a new folder in {$currentFolder?.name || 'root'}</DialogDescription>
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
