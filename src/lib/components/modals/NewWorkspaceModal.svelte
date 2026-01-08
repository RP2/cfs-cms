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
	import { Loader2 } from '@lucide/svelte';

	let { open = $bindable(false) } = $props();

	let workspaceName = $state('');
	let workspaceDescription = $state('');
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (open) {
			workspaceName = '';
			workspaceDescription = '';
			error = '';
			loading = false;
		}
	});

	function handleClose() {
		open = false;
		workspaceName = '';
		workspaceDescription = '';
		error = '';
		loading = false;
	}

	async function handleCreate() {
		if (!workspaceName.trim()) {
			error = 'Workspace name is required';
			return;
		}

		error = '';
		loading = true;

		try {
			await createWorkspace(workspaceName, workspaceDescription);
		} catch (e) {
			error = (e as Error).message;
			loading = false;
		} finally {
			if (loading) handleClose();
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
			<Button variant="outline" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button onclick={handleCreate} disabled={!workspaceName.trim() || loading}>
				{#if loading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create Workspace
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
