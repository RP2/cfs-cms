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

	function handleDelete() {
		if (!workspace) return;

		deleteWorkspace(workspace.id);
		handleClose();
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Workspace</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{workspace?.name}"?
				<br /><br />
				This will move the workspace and all its contents (folders and files) to trash. You can recover
				them later from the Trash section.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Delete Workspace</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
