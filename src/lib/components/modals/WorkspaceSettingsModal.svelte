<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentWorkspace } from '$lib/stores';
	import {
		renameWorkspace,
		updateWorkspaceDescription,
		updateWorkspaceIcon
	} from '$lib/services/dataService';
	import IconPickerModal from './IconPickerModal.svelte';
	import { getWorkspaceIconComponent } from './IconPickerModal.svelte';
	import { Copy, Check } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let editName = $state('');
	let editDescription = $state('');
	let pendingIcon = $state<string | null>(null);
	let copied = $state(false);
	let iconPickerOpen = $state(false);

	// Track if anything has changed
	let hasChanges = $derived.by(() => {
		if (!$currentWorkspace) return false;
		return (
			editName !== $currentWorkspace.name ||
			editDescription !== ($currentWorkspace.description || '') ||
			pendingIcon !== null
		);
	});

	// Sync with current workspace when it changes
	$effect(() => {
		if ($currentWorkspace) {
			editName = $currentWorkspace.name;
			editDescription = $currentWorkspace.description || '';
		}
	});

	// Clear edits when modal closes
	$effect(() => {
		if (!open && $currentWorkspace) {
			editName = $currentWorkspace.name;
			editDescription = $currentWorkspace.description || '';
			pendingIcon = null;
		}
	});

	function copyWorkspaceId() {
		if ($currentWorkspace) {
			navigator.clipboard.writeText($currentWorkspace.id);
			copied = true;
			toast.success('Workspace ID copied');
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function generateApiKey() {
		// TODO: Phase 2 - Generate and display API key for this workspace
		toast.info('API key generation coming in Phase 2');
	}

	function handleSave() {
		if (!$currentWorkspace) return;

		if (editName.trim() === '') {
			toast.error('Workspace name cannot be empty');
			return;
		}

		if (editName !== $currentWorkspace.name) {
			renameWorkspace($currentWorkspace.id, editName);
		}

		if (editDescription !== ($currentWorkspace.description || '')) {
			updateWorkspaceDescription($currentWorkspace.id, editDescription);
		}

		if (pendingIcon && pendingIcon !== $currentWorkspace.icon) {
			updateWorkspaceIcon($currentWorkspace.id, pendingIcon);
		}

		toast.success('Workspace updated');
		open = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && hasChanges) {
			e.preventDefault();
			handleSave();
		}
	}

	function handleIconSelect(iconId: string) {
		pendingIcon = iconId;
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md" onkeydown={handleKeyDown}>
		<DialogHeader>
			<DialogTitle>Workspace Settings</DialogTitle>
			<DialogDescription>
				Configure settings for <span class="font-semibold">{$currentWorkspace?.name}</span>
			</DialogDescription>
		</DialogHeader>

		{#if $currentWorkspace}
			<div class="space-y-6">
				<!-- Workspace Name -->
				<div class="space-y-2">
					<Label for="ws-name">Workspace Name</Label>
					<Input id="ws-name" bind:value={editName} placeholder="Enter workspace name" autofocus />
				</div>

				<!-- Description -->
				<div class="space-y-2">
					<Label for="ws-desc">Description</Label>
					<Textarea
						id="ws-desc"
						bind:value={editDescription}
						placeholder="Enter workspace description (optional)"
						rows={3}
					/>
				</div>

				<!-- Workspace Icon -->
				<div class="space-y-2">
					<Label>Change Workspace Icon</Label>
					<Button
						variant="outline"
						class="h-10 w-full justify-start gap-2"
						onclick={() => (iconPickerOpen = true)}
					>
						{#if $currentWorkspace}
							{@const displayIcon = pendingIcon || $currentWorkspace.icon}
							{@const IconComponent = getWorkspaceIconComponent({
								...$currentWorkspace,
								icon: displayIcon
							})}
							<IconComponent class="h-5 w-5" />
						{/if}
						<span>Select Icon</span>
					</Button>
				</div>

				<!-- Workspace ID (for API calls) -->
				<div class="space-y-2">
					<Label for="ws-id">Workspace ID</Label>
					<div class="flex gap-2">
						<Input
							id="ws-id"
							value={$currentWorkspace.id}
							disabled
							class="flex-1 font-mono text-xs"
						/>
						<Button
							size="sm"
							variant="outline"
							onclick={copyWorkspaceId}
							title="Copy workspace ID"
							class="px-2"
						>
							{#if copied}
								<Check class="h-4 w-4 text-accent" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</Button>
					</div>
					<p class="text-xs text-muted-foreground">
						Use this ID in API calls to fetch files from other sites
					</p>
				</div>

				<!-- API Key Section -->
				<div class="space-y-2">
					<Label>API Access</Label>
					<Button variant="outline" class="w-full" onclick={generateApiKey}>
						Generate API Key
					</Button>
					<p class="text-xs text-muted-foreground">
						API keys allow other websites to fetch files from this workspace
					</p>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2 pt-4">
					<Button
						variant={hasChanges ? 'default' : 'secondary'}
						class="flex-1 {hasChanges ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}"
						onclick={handleSave}
						disabled={!hasChanges}
					>
						Save Changes
					</Button>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>

<IconPickerModal bind:open={iconPickerOpen} onSelect={handleIconSelect} />
