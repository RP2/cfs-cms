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
	import { Label } from '$lib/components/ui/label';
	import { createWorkspace } from '$lib/services/dataService';

	let { open = $bindable(false) } = $props();

	let workspaceName = $state('');
	let workspaceDescription = $state('');
	let error = $state('');

	$effect(() => {
		if (open) {
			workspaceName = '';
			workspaceDescription = '';
			error = '';
		}
	});

	function handleClose() {
		open = false;
		workspaceName = '';
		workspaceDescription = '';
		error = '';
	}

	function handleCreate() {
		if (!workspaceName.trim()) {
			error = 'Workspace name is required';
			return;
		}

		try {
			createWorkspace(workspaceName, workspaceDescription);
			handleClose();
		} catch (e) {
			error = (e as Error).message;
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
			<DialogTitle>Create New Workspace</DialogTitle>
			<DialogDescription>
				Create a new workspace to organize your content and collaborate with others
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="workspace-name">Workspace Name</Label>
				<Input
					id="workspace-name"
					bind:value={workspaceName}
					placeholder="e.g., Marketing Team"
					onkeydown={handleKeydown}
					autofocus
				/>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="workspace-description">Description (optional)</Label>
				<Input
					id="workspace-description"
					bind:value={workspaceDescription}
					placeholder="Describe what this workspace is for..."
					onkeydown={handleKeydown}
				/>
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleCreate}>Create Workspace</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
