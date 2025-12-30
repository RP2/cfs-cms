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
	import { workspaces, currentWorkspace, currentFolder } from '$lib/stores';
	import { deleteWorkspace } from '$lib/services/dataService';
	import type { Workspace } from '$lib/types';

	let { open = $bindable(false), workspace = $bindable<Workspace | null>(null) } = $props();

	function handleClose() {
		open = false;
		workspace = null;
	}

	let errorMessage = $state<string | null>(null);

	function handleDelete() {
		if (!workspace) return;

		try {
			deleteWorkspace(workspace.id);
			handleClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to delete workspace';
		}
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Workspace</DialogTitle>
			<DialogDescription>
				Are you sure you want to permanently delete "{workspace?.name}"?
				<br /><br />
				<strong>This action cannot be undone.</strong> The workspace must be empty (no files or
				folders) before deletion. Please delete or move all contents to another workspace first.
				{#if errorMessage}
					<br /><br />
					<span class="font-semibold text-destructive">{errorMessage}</span>
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Delete Workspace</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
