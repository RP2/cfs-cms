<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import NewFolderModal from './modals/NewFolderModal.svelte';
	import RenameModal from './modals/RenameModal.svelte';
	import EditFileModal from './modals/EditFileModal.svelte';
	import DeleteConfirmModal from './modals/DeleteConfirmModal.svelte';
	import UploadModal from './modals/UploadModal.svelte';
	import GridView from './GridView.svelte';
	import ListView from './ListView.svelte';
	import {
		currentFiles,
		currentFolder,
		currentWorkspace,
		workspaceFolders,
		workspaces,
		selectedFileIds,
		viewType,
		currentView,
		workspaceTags,
		appliedFilters
	} from '$lib/stores';
	import {
		toggleFileStar,
		toggleFolderStar,
		restoreFile,
		restoreFolder,
		permanentlyDeleteFile,
		permanentlyDeleteFolder
	} from '$lib/services/dataService';
	import type { File, Folder, Tag } from '$lib/types';
	import type { SvelteComponent } from 'svelte';
	import { File as FileIcon, FileImage, FileVideo, FileText, X } from '@lucide/svelte';

	type IconComponent = typeof SvelteComponent;

	const TRASH_RETENTION_DAYS = 30;
	const MS_PER_DAY = 24 * 60 * 60 * 1000;

	let files = $state<File[]>([]);
	let folders = $state<Folder[]>([]);
	let tagMap = $state<Map<string, Tag>>(new Map());
	let tagHeading = $state('FILES');
	let isLoading = $state(true);

	let showNewFolderModal = $state(false);
	let parentFolderId = $state<string | null>(null);
	let showRenameModal = $state(false);
	let showDeleteModal = $state(false);
	let showUploadModal = $state(false);
	let showEditFileModal = $state(false);

	let renameTarget = $state<File | Folder | null>(null);
	let renameType = $state<'file' | 'folder'>('file');
	let deleteTarget = $state<File | Folder | null>(null);
	let deleteType = $state<'file' | 'folder'>('file');
	let editFileTarget = $state<File | null>(null);

	const isTrashView = $derived($currentView === 'trash');
	const isTagsView = $derived($currentView === 'tags');
	const isStarredView = $derived($currentView === 'starred');

	const deletedWorkspaces = $derived($workspaces.filter((ws) => ws.deletedAt));

	const derivedFolders = $derived.by(() => {
		if (!$currentWorkspace) return [];
		if (isTagsView) return [];

		if (isStarredView) {
			return $workspaceFolders.filter(
				(f) => f.workspaceId === $currentWorkspace.id && f.starred && !f.deletedAt
			);
		}

		const parentId = $currentFolder?.id ?? null;
		if (isTrashView) {
			return $workspaceFolders.filter(
				(f) => f.workspaceId === $currentWorkspace.id && f.parentId === parentId && !!f.deletedAt
			);
		}

		return $workspaceFolders.filter(
			(f) => f.workspaceId === $currentWorkspace.id && f.parentId === parentId && !f.deletedAt
		);
	});

	const derivedFiles = $derived.by(() => {
		if (!$currentWorkspace) return [];

		if (isTrashView) {
			return $currentFiles.filter((f) => f.workspaceId === $currentWorkspace.id && !!f.deletedAt);
		}

		if (isTagsView) {
			// Show all tagged files in workspace (or filter by appliedFilters if set)
			if ($appliedFilters.size > 0) {
				return $currentFiles.filter(
					(f) =>
						f.workspaceId === $currentWorkspace.id &&
						!f.deletedAt &&
						f.tagIds?.some((id) => $appliedFilters.has(id))
				);
			}
			// Show all tagged files when no specific tag filter is applied
			return $currentFiles.filter(
				(f) =>
					f.workspaceId === $currentWorkspace.id && !f.deletedAt && f.tagIds && f.tagIds.length > 0
			);
		}

		if (isStarredView) {
			return $currentFiles.filter(
				(f) => f.workspaceId === $currentWorkspace.id && f.starred && !f.deletedAt
			);
		}

		const parentId = $currentFolder?.id ?? null;
		return $currentFiles.filter(
			(f) => f.workspaceId === $currentWorkspace.id && f.folderId === parentId && !f.deletedAt
		);
	});

	$effect(() => {
		tagMap = new Map($workspaceTags.map((t) => [t.id, t]));
		const firstTagId = [...$appliedFilters][0];
		if (isTagsView && firstTagId) {
			tagHeading = tagMap.get(firstTagId)?.name ?? 'FILES';
		} else {
			tagHeading = 'FILES';
		}
	});

	$effect(() => {
		folders = derivedFolders;
		files = derivedFiles;
	});

	$effect(() => {
		isLoading = true;
		const timer = setTimeout(() => {
			isLoading = false;
		}, 150);
		return () => clearTimeout(timer);
	});

	function toggleFileSelect(fileId: string) {
		const newSelection = new Set($selectedFileIds);
		if (newSelection.has(fileId)) {
			newSelection.delete(fileId);
		} else {
			newSelection.add(fileId);
		}
		selectedFileIds.set(newSelection);
	}

	function navigateToFolder(folder: Folder) {
		if (isTrashView) {
			currentFolder.set(folder);
			return;
		}
		currentView.set('normal');
		currentFolder.set(folder);
	}

	function getFileIconComponent(mimeType: string): IconComponent {
		if (mimeType.startsWith('image/')) return FileImage as unknown as IconComponent;
		if (mimeType.startsWith('video/')) return FileVideo as unknown as IconComponent;
		if (mimeType.includes('pdf')) return FileText as unknown as IconComponent;
		return FileIcon as unknown as IconComponent;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getTrashExpiry(item: File | Folder): Date | null {
		const deletedAt = item.deletedAt;
		if (!deletedAt && !item.trashedUntil) return null;
		const base = item.trashedUntil ?? new Date(new Date(deletedAt as Date).getTime());
		if (!item.trashedUntil && deletedAt) {
			base.setTime(base.getTime() + TRASH_RETENTION_DAYS * MS_PER_DAY);
		}
		return base;
	}

	function formatTrashExpiry(item: File | Folder): string | null {
		const expiry = getTrashExpiry(item);
		if (!expiry) return null;
		const today = Date.now();
		const diffDays = Math.max(0, Math.ceil((expiry.getTime() - today) / MS_PER_DAY));
		return `${formatDate(expiry)} (${diffDays} day${diffDays === 1 ? '' : 's'} left)`;
	}

	function getTagClass(tagId: string): string {
		const tag = tagMap.get(tagId);
		if (!tag) return 'border-transparent bg-muted text-muted-foreground';
		const textColor = tag.color === 'muted' ? 'muted-foreground' : `${tag.color}-foreground`;
		return `border-transparent bg-${tag.color} text-${textColor}`;
	}

	function openRename(item: File | Folder, type: 'file' | 'folder') {
		if (type === 'file') {
			editFileTarget = item as File;
			showEditFileModal = true;
			return;
		}
		renameTarget = item;
		renameType = type;
		showRenameModal = true;
	}

	function openDelete(item: File | Folder, type: 'file' | 'folder') {
		deleteTarget = item;
		deleteType = type;
		showDeleteModal = true;
	}

	function openNewFolder(folderId: string | null = null) {
		parentFolderId = folderId;
		showNewFolderModal = true;
	}

	function openUpload() {
		showUploadModal = true;
	}

	function handleStarFile(fileId: string) {
		toggleFileStar(fileId);
	}

	function handleStarFolder(folderId: string) {
		toggleFolderStar(folderId);
	}

	function handleRestoreFile(fileId: string) {
		restoreFile(fileId);
	}

	function handleRestoreFolder(folderId: string) {
		restoreFolder(folderId);
	}

	function handlePermanentDeleteFile(fileId: string) {
		permanentlyDeleteFile(fileId);
	}

	function handlePermanentDeleteFolder(folderId: string) {
		permanentlyDeleteFolder(folderId);
	}

	function handleRestoreWorkspace(workspaceId: string) {
		const updated = $workspaces.map((ws) =>
			ws.id === workspaceId ? { ...ws, deletedAt: null } : ws
		);
		workspaces.set(updated);
	}

	function handlePermanentDeleteWorkspace(workspaceId: string) {
		const updated = $workspaces.filter((ws) => ws.id !== workspaceId);
		workspaces.set(updated);
	}

	function selectAll() {
		const allIds = new Set(files.map((f) => f.id));
		selectedFileIds.set(allIds);
	}

	function clearSelection() {
		selectedFileIds.set(new Set());
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			selectAll();
		}
		if (e.key === 'Escape') {
			clearSelection();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $selectedFileIds.size > 0}
	<div
		class="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg border border-accent bg-accent/95 p-4 shadow-lg backdrop-blur-sm"
	>
		<span class="text-sm font-medium text-accent-foreground"
			>{$selectedFileIds.size} file{$selectedFileIds.size !== 1 ? 's' : ''} selected</span
		>
		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				class="h-8 px-2 text-accent-foreground hover:bg-accent/80"
				onclick={selectAll}
			>
				Select All
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-8 px-2 text-accent-foreground hover:bg-accent/80"
				onclick={clearSelection}
			>
				<X class="h-4 w-4" />
				Clear
			</Button>
		</div>
	</div>
{/if}

{#if $viewType === 'grid'}
	<GridView
		{isTrashView}
		{isLoading}
		currentFolder={$currentFolder}
		currentView={$currentView}
		{folders}
		{files}
		{tagHeading}
		{tagMap}
		selectedFileIds={$selectedFileIds}
		{deletedWorkspaces}
		trashRetentionDays={TRASH_RETENTION_DAYS}
		{formatFileSize}
		{formatDate}
		{formatTrashExpiry}
		{getFileIconComponent}
		{getTagClass}
		onNavigateToFolder={navigateToFolder}
		onToggleFileSelect={toggleFileSelect}
		onOpenNewFolder={openNewFolder}
		onOpenRename={openRename}
		onOpenDelete={openDelete}
		onOpenUpload={openUpload}
		onHandleStarFile={handleStarFile}
		onHandleStarFolder={handleStarFolder}
		onHandleRestoreFile={handleRestoreFile}
		onHandleRestoreFolder={handleRestoreFolder}
		onHandlePermanentDeleteFile={handlePermanentDeleteFile}
		onHandlePermanentDeleteFolder={handlePermanentDeleteFolder}
		onHandleRestoreWorkspace={handleRestoreWorkspace}
		onHandlePermanentDeleteWorkspace={handlePermanentDeleteWorkspace}
	/>
{:else}
	<ListView
		{isTrashView}
		{isLoading}
		currentFolder={$currentFolder}
		currentView={$currentView}
		{folders}
		{files}
		{tagHeading}
		{tagMap}
		selectedFileIds={$selectedFileIds}
		{deletedWorkspaces}
		trashRetentionDays={TRASH_RETENTION_DAYS}
		{formatFileSize}
		{formatDate}
		{formatTrashExpiry}
		{getFileIconComponent}
		{getTagClass}
		onNavigateToFolder={navigateToFolder}
		onToggleFileSelect={toggleFileSelect}
		onOpenNewFolder={openNewFolder}
		onOpenRename={openRename}
		onOpenDelete={openDelete}
		onOpenUpload={openUpload}
		onHandleStarFile={handleStarFile}
		onHandleStarFolder={handleStarFolder}
		onHandleRestoreFile={handleRestoreFile}
		onHandleRestoreFolder={handleRestoreFolder}
		onHandlePermanentDeleteFile={handlePermanentDeleteFile}
		onHandlePermanentDeleteFolder={handlePermanentDeleteFolder}
		onHandleRestoreWorkspace={handleRestoreWorkspace}
		onHandlePermanentDeleteWorkspace={handlePermanentDeleteWorkspace}
	/>
{/if}

<NewFolderModal bind:open={showNewFolderModal} bind:parentFolderId />
<RenameModal bind:open={showRenameModal} bind:item={renameTarget} bind:itemType={renameType} />
<EditFileModal bind:open={showEditFileModal} bind:file={editFileTarget} />
<DeleteConfirmModal
	bind:open={showDeleteModal}
	bind:item={deleteTarget}
	bind:itemType={deleteType}
/>
<UploadModal bind:open={showUploadModal} />

<style>
	:global(.card-footer) {
		display: flex;
		flex-direction: column;
	}
</style>
