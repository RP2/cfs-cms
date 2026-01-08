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
	import {
		workspaces,
		currentWorkspace,
		currentFolder,
		currentFiles,
		workspaceFolders
	} from '$lib/stores';
	import { deleteWorkspace } from '$lib/services/dataService';
	import type { Workspace } from '$lib/types';
	import { get } from 'svelte/store';

	let { open = $bindable(false), workspace = $bindable<Workspace | null>(null) } = $props();

	function handleClose() {
		open = false;
		workspace = null;
		errorMessage = null;
	}

	let errorMessage = $state<string | null>(null);
	let loading = $state(false);

	// Check if workspace has non-deleted content
	function getWorkspaceStatus() {
		if (!workspace) return { hasContent: false, trashedCount: 0 };

		const files = get(currentFiles).filter(
			(f) => f.workspaceId === workspace!.id && f.deletedAt === null
		);
		const folders = get(workspaceFolders).filter(
			(f) => f.workspaceId === workspace!.id && f.deletedAt === null
		);
		const trashed = get(currentFiles).filter(
			(f) => f.workspaceId === workspace!.id && f.deletedAt !== null
		);
		const trashedFolders = get(workspaceFolders).filter(
			(f) => f.workspaceId === workspace!.id && f.deletedAt !== null
		);

		return {
			hasContent: files.length > 0 || folders.length > 0,
			trashedCount: trashed.length + trashedFolders.length
		};
	}

	async function handleDelete() {
		if (!workspace) return;

		errorMessage = null;
		loading = true;

		const status = getWorkspaceStatus();
		const shouldEmptyTrash = !status.hasContent && status.trashedCount > 0;

		try {
			const deletedCount = await deleteWorkspace(workspace.id, shouldEmptyTrash);

			handleClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to delete workspace';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open) {
			errorMessage = null;
		}
	});
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Workspace</DialogTitle>
			<DialogDescription>
				{#if workspace}
					{@const status = getWorkspaceStatus()}
					{#if status.hasContent}
						Are you sure you want to permanently delete "{workspace.name}"?
						<br /><br />
						<strong>This workspace is not empty.</strong> It contains files or folders that must be deleted
						or moved to another workspace first.
					{:else if status.trashedCount > 0}
						Are you sure you want to delete "{workspace.name}"?
						<br /><br />
						This workspace only contains {status.trashedCount} item{status.trashedCount === 1
							? ''
							: 's'} in trash. These will be <strong>permanently deleted</strong>.
						<br /><br />
						<strong>This action cannot be undone.</strong>
					{:else}
						Are you sure you want to permanently delete the empty workspace "{workspace.name}"?
						<br /><br />
						<strong>This action cannot be undone.</strong>
					{/if}

					{#if errorMessage}
						<br /><br />
						<span class="font-semibold text-destructive">{errorMessage}</span>
					{/if}
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={handleDelete}
				disabled={loading || (workspace && getWorkspaceStatus().hasContent)}
			>
				{#if loading}
					Deleting...
				{:else if workspace && getWorkspaceStatus().hasContent}
					Cannot Delete
				{:else}
					Delete Workspace
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
