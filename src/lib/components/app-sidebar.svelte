<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		currentWorkspace,
		currentFolder,
		viewType,
		workspaceFolders,
		workspaces,
		currentView,
		viewScope
	} from '$lib/stores';
	import { moveFilesToFolder, moveFilesToWorkspace } from '$lib/services/dataService';
	import { allowMoveDrop, parseDragData } from '$lib/utils/drag';
	import type { Folder, Workspace } from '$lib/types';
	import FolderItem from './FolderItem.svelte';
	import NewFolderModal from './modals/NewFolderModal.svelte';
	import NewWorkspaceModal from './modals/NewWorkspaceModal.svelte';
	import RenameModal from './modals/RenameModal.svelte';
	import DeleteConfirmModal from './modals/DeleteConfirmModal.svelte';
	import DeleteWorkspaceModal from './modals/DeleteWorkspaceModal.svelte';
	import {
		Briefcase,
		Star,
		Tag,
		Plus,
		Trash2,
		Grid3x3,
		List,
		User,
		BookOpen,
		Glasses,
		Palette,
		Zap,
		Rocket,
		Target,
		Trophy,
		Lightbulb,
		Archive
	} from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';
	import IconPickerModal from './modals/IconPickerModal.svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	type WorkspaceIcon =
		| 'briefcase'
		| 'book'
		| 'glasses'
		| 'palette'
		| 'zap'
		| 'rocket'
		| 'target'
		| 'trophy'
		| 'lightbulb'
		| 'archive'
		| 'star'
		| 'grid'
		| 'tag';
	const workspaceIconMap: Record<WorkspaceIcon, typeof Briefcase> = {
		briefcase: Briefcase,
		book: BookOpen,
		glasses: Glasses,
		palette: Palette,
		zap: Zap,
		rocket: Rocket,
		target: Target,
		trophy: Trophy,
		lightbulb: Lightbulb,
		archive: Archive,
		star: Star,
		grid: Grid3x3,
		tag: Tag
	};

	let newFolderModalOpen = $state(false);
	let newWorkspaceModalOpen = $state(false);
	let renameModalOpen = $state(false);
	let deleteModalOpen = $state(false);
	let deleteWorkspaceModalOpen = $state(false);
	let iconPickerModalOpen = $state(false);
	let iconPickerWorkspaceId = $state<string | null>(null);
	let renameTarget = $state<Folder | null>(null);
	let deleteTarget = $state<Folder | null>(null);
	let deleteWorkspaceTarget = $state<Workspace | null>(null);
	let showCrossDropConfirm = $state(false);
	let pendingDropIds = $state<string[]>([]);
	let pendingDropTargetWorkspaceId = $state<string | null>(null);
	let pendingDropTargetFolderId = $state<string | null>(null);
	let activeDropTargetKey = $state<string | null>(null);

	function clearActiveDropTarget(key?: string) {
		if (!key || activeDropTargetKey === key) {
			activeDropTargetKey = null;
		}
	}

	function selectWorkspace(workspace: any) {
		currentWorkspace.set(workspace);
		currentFolder.set(null);
		currentView.set('normal');
		viewScope.set('workspace');
	}

	function clearPendingDrop() {
		showCrossDropConfirm = false;
		pendingDropIds = [];
		pendingDropTargetWorkspaceId = null;
		pendingDropTargetFolderId = null;
	}

	function confirmCrossWorkspaceDrop() {
		if (!pendingDropIds.length || !pendingDropTargetWorkspaceId) {
			clearPendingDrop();
			return;
		}
		moveFilesToWorkspace(pendingDropIds, pendingDropTargetWorkspaceId, pendingDropTargetFolderId);
		clearPendingDrop();
	}

	function handleSidebarDragOver(event: DragEvent, key?: string) {
		allowMoveDrop(event);
		if (key) activeDropTargetKey = key;
	}

	function handleSidebarDragLeave(key?: string) {
		clearActiveDropTarget(key);
	}

	function handleSidebarDrop(
		event: DragEvent,
		targetWorkspaceId: string,
		targetFolderId: string | null
	) {
		allowMoveDrop(event);
		const parsed = parseDragData(event);
		if (parsed?.type !== 'file' || !parsed.ids?.length) return;

		const ids = parsed.ids;
		const isCrossWorkspace = $currentWorkspace && targetWorkspaceId !== $currentWorkspace.id;
		clearActiveDropTarget();
		if (isCrossWorkspace) {
			pendingDropIds = ids;
			pendingDropTargetWorkspaceId = targetWorkspaceId;
			pendingDropTargetFolderId = targetFolderId;
			showCrossDropConfirm = true;
			return;
		}

		moveFilesToFolder(ids, targetFolderId, { targetWorkspaceId });
	}

	function getWorkspaceIconComponent(workspace: Workspace) {
		const iconName = (workspace.icon as WorkspaceIcon) ?? 'briefcase';
		return workspaceIconMap[iconName];
	}

	function openIconPicker(workspaceId: string) {
		iconPickerWorkspaceId = workspaceId;
		iconPickerModalOpen = true;
	}

	function handleIconSelect(iconId: string) {
		if (iconPickerWorkspaceId) {
			const updated = $workspaces.map((ws) =>
				ws.id === iconPickerWorkspaceId ? { ...ws, icon: iconId } : ws
			);
			workspaces.set(updated);
			if ($currentWorkspace?.id === iconPickerWorkspaceId) {
				currentWorkspace.set(updated.find((ws) => ws.id === iconPickerWorkspaceId) ?? null);
			}
		}
	}

	function handleDeleteWorkspace(workspace: Workspace) {
		deleteWorkspaceTarget = workspace;
		deleteWorkspaceModalOpen = true;
	}

	function openQuickLink(view: 'starred' | 'tags' | 'trash') {
		currentView.set(view);
		currentFolder.set(null);
		viewScope.set('workspace');
	}

	// Use $derived for reactive root folders list - updates immediately when folders change
	let rootFolders = $derived(
		$currentWorkspace
			? $workspaceFolders.filter(
					(f: Folder) =>
						f.parentId === null && f.workspaceId === $currentWorkspace.id && !f.deletedAt
				)
			: []
	);

	function handleRenameFolder(folder: Folder) {
		renameTarget = folder;
		renameModalOpen = true;
	}

	function handleDeleteFolder(folder: Folder) {
		deleteTarget = folder;
		deleteModalOpen = true;
	}

	function openNewFolder() {
		newFolderModalOpen = true;
	}

	function openNewWorkspace() {
		newWorkspaceModalOpen = true;
	}

	// Active workspace icon for header reflects picker selection
	let currentWorkspaceIcon = $derived(
		$currentWorkspace ? getWorkspaceIconComponent($currentWorkspace) : Briefcase
	);

	function navigateToWorkspaceRoot() {
		currentFolder.set(null);
		currentView.set('normal');
		viewScope.set('workspace');
	}
</script>

<svelte:window ondragend={() => clearActiveDropTarget()} ondrop={() => clearActiveDropTarget()} />

<Sidebar.Root {collapsible} {...restProps} bind:ref>
	<!-- Workspace Selector Header -->
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				{@const CurrentIcon = currentWorkspaceIcon}
				<Sidebar.MenuButton
					size="lg"
					class="data-[state=open]:bg-sidebar-accent "
					onclick={navigateToWorkspaceRoot}
				>
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
					>
						<CurrentIcon class="size-4"></CurrentIcon>
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">
							{$currentWorkspace?.name || 'Select Workspace'}
						</span>
						<span class="truncate text-xs">Content Management</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<!-- Workspace List -->
		<Sidebar.Separator />
		<Sidebar.Menu>
			<Sidebar.GroupLabel>WORKSPACES</Sidebar.GroupLabel>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton onclick={openNewWorkspace}>
					<Plus class="size-4" />
					<span>New Workspace</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			{#each $workspaces as workspace (workspace.id)}
				{@const WorkspaceIcon = getWorkspaceIconComponent(workspace)}
				<Sidebar.MenuItem>
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							<Sidebar.MenuButton
								isActive={$currentWorkspace?.id === workspace.id}
								onclick={() => selectWorkspace(workspace)}
								ondragover={(event) => handleSidebarDragOver(event, `ws-${workspace.id}`)}
								ondragleave={() => handleSidebarDragLeave(`ws-${workspace.id}`)}
								ondrop={(event) => handleSidebarDrop(event, workspace.id, null)}
								class={`${
									$currentWorkspace?.id === workspace.id
										? 'border-accent bg-accent/15 text-foreground ring-1 ring-accent'
										: ''
								} ${activeDropTargetKey === `ws-${workspace.id}` ? 'ring-2 ring-accent' : ''}`.trim()}
							>
								<WorkspaceIcon class="size-4 text-current" />
								<span>{workspace.name}</span>
							</Sidebar.MenuButton>
						</ContextMenu.Trigger>
						<ContextMenu.Content>
							<ContextMenu.Item onclick={() => openIconPicker(workspace.id)}>
								Change icon
							</ContextMenu.Item>
							<ContextMenu.Item
								variant="destructive"
								onclick={() => handleDeleteWorkspace(workspace)}
							>
								Delete workspace
							</ContextMenu.Item>
						</ContextMenu.Content>
					</ContextMenu.Root>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>

		<!-- Remove MenuAction -->
	</Sidebar.Header>

	<!-- Main Navigation -->
	<Sidebar.Content>
		<!-- Folders -->
		<Sidebar.Separator />
		<Sidebar.Group>
			<Sidebar.GroupLabel>FOLDERS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={openNewFolder}>
						<Plus class="size-4" />
						<span>New Folder</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>

				{#each rootFolders as folder (folder.id)}
					<FolderItem
						{folder}
						{activeDropTargetKey}
						onFolderDragOver={(event, key) => handleSidebarDragOver(event, key)}
						onFolderDragLeave={(key) => handleSidebarDragLeave(key)}
						onFolderDrop={(event, folderId, workspaceId) =>
							handleSidebarDrop(event, workspaceId, folderId)}
						on:rename-folder={(event) => handleRenameFolder(event.detail)}
						on:delete-folder={(event) => handleDeleteFolder(event.detail)}
					/>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Quick Links -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>QUICK LINKS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => openQuickLink('starred')}>
						<Star class="size-4" />
						<span>Starred</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => openQuickLink('tags')}>
						<Tag class="size-4" />
						<span>Tags</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => openQuickLink('trash')}>
						<Trash2 class="size-4" />
						<span>Trash</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>

	<!-- Footer with View Toggle & User -->
	<Sidebar.Footer>
		<!-- View Toggle -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					title={$viewType === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
					onclick={() => viewType.set($viewType === 'grid' ? 'list' : 'grid')}
				>
					{#if $viewType === 'grid'}
						<Grid3x3 class="h-4 w-4" />
						<span>Grid View</span>
					{:else}
						<List class="h-4 w-4" />
						<span>List View</span>
					{/if}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<Sidebar.Separator />

		<!-- User Menu -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					<Avatar class="h-8 w-8 rounded-lg">
						<AvatarFallback class="rounded-lg">
							<User class="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">User Account</span>
						<span class="truncate text-xs">user@example.com</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<NewFolderModal bind:open={newFolderModalOpen} />
	<NewWorkspaceModal bind:open={newWorkspaceModalOpen} />
	<RenameModal bind:open={renameModalOpen} bind:item={renameTarget} itemType="folder" />
	<DeleteConfirmModal bind:open={deleteModalOpen} bind:item={deleteTarget} itemType="folder" />
	<DeleteWorkspaceModal
		bind:open={deleteWorkspaceModalOpen}
		bind:workspace={deleteWorkspaceTarget}
	/>
	<IconPickerModal bind:open={iconPickerModalOpen} onSelect={handleIconSelect} />

	<Sidebar.Rail />
</Sidebar.Root>

<Dialog bind:open={showCrossDropConfirm}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Move to another workspace?</DialogTitle>
			<DialogDescription>
				Move {pendingDropIds.length} file{pendingDropIds.length === 1 ? '' : 's'} to
				{#if pendingDropTargetWorkspaceId}
					{$workspaces.find((ws) => ws.id === pendingDropTargetWorkspaceId)?.name ?? 'workspace'}
				{:else}
					workspace
				{/if}
				?
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={clearPendingDrop}>Cancel</Button>
			<Button variant="destructive" onclick={confirmCrossWorkspaceDrop}>Move</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
