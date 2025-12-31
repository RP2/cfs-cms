<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Combobox } from '$lib/components/ui/combobox';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
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
		appliedFilters,
		clipboard
	} from '$lib/stores';
	import {
		toggleFileStar,
		toggleFolderStar,
		restoreFile,
		restoreFolder,
		permanentlyDeleteFile,
		permanentlyDeleteFolder,
		deleteFiles,
		moveFilesToFolder,
		moveFilesToWorkspace,
		moveFolder,
		moveFolderToWorkspace,
		addTagsToFiles,
		copyFilesToFolder,
		copyFilesToWorkspace,
		copyFoldersToFolder
	} from '$lib/services/dataService';
	import {
		buildDragPayload,
		setDragData,
		parseDragData,
		allowMoveDrop,
		createDragController,
		setDragImageFromTarget,
		DRAG_ARM_DELAY_MS,
		DRAG_MOVE_THRESHOLD_PX
	} from '$lib/utils/drag';
	import {
		buildFolderPath as buildFolderPathUtil,
		formatDateShort,
		formatFileSize,
		formatTrashExpiry as formatTrashExpiryUtil,
		getTagClass as getTagClassUtil,
		getWorkspaceName as getWorkspaceNameUtil
	} from '$lib/utils/formatters';
	import type { File, Folder, Tag as TagType } from '$lib/types';
	import type { SvelteComponent } from 'svelte';
	import {
		File as FileIcon,
		FileImage,
		FileVideoCamera,
		FileText,
		X,
		Trash2,
		RotateCcw,
		FolderUp,
		Tag,
		Building2,
		Folder as FolderIconOutline,
		Copy
	} from '@lucide/svelte';

	type IconComponent = typeof SvelteComponent;

	const TRASH_RETENTION_DAYS = 30;
	let selectionContextKey = $state('');

	let files = $state<File[]>([]);
	let folders = $state<Folder[]>([]);
	let tagMap = $state<Map<string, TagType>>(new Map());
	let tagHeading = $state('FILES');
	let isLoading = $state(true);

	let showNewFolderModal = $state(false);
	let parentFolderId = $state<string | null>(null);
	let showRenameModal = $state(false);
	let showDeleteModal = $state(false);
	let showUploadModal = $state(false);
	let showEditFileModal = $state(false);

	let showMoveModal = $state(false);
	let showMoveConfirm = $state(false);
	let showTagModal = $state(false);
	let showBulkTrashConfirm = $state(false);
	let moveTargetWorkspaceId = $state<string>('');
	let moveTargetFolderId = $state<string>('');
	let moveError = $state('');
	let tagError = $state('');
	let bulkSelectedTags = $state<Set<string>>(new Set());
	let bulkPendingTagNames = $state<string[]>([]);
	let pendingMoveIds = $state<string[]>([]);
	const dragController = createDragController(DRAG_ARM_DELAY_MS, DRAG_MOVE_THRESHOLD_PX);
	const folderDragController = createDragController(DRAG_ARM_DELAY_MS, DRAG_MOVE_THRESHOLD_PX);
	let dragArmingId = $state<string | null>(null);
	let folderDragArmingId = $state<string | null>(null);
	let activeFolderDropKey = $state<string | null>(null);

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

	const availableWorkspaces = $derived($workspaces.filter((ws) => !ws.deletedAt));

	const moveFolderOptions = $derived.by(() => {
		const wsId = moveTargetWorkspaceId || $currentWorkspace?.id;
		if (!wsId) return [];
		return $workspaceFolders.filter((f) => f.workspaceId === wsId && !f.deletedAt);
	});

	const availableTags = $derived($workspaceTags.filter((t) => !t.deletedAt));

	const availableTagOptions = $derived(
		availableTags
			.filter(
				(tag) =>
					!bulkSelectedTags.has(tag.name) &&
					!bulkPendingTagNames.some((pending) => pending.toLowerCase() === tag.name.toLowerCase())
			)
			.map((tag) => ({ id: tag.id, label: tag.name }))
	);

	const allVisibleSelected = $derived(
		files.length > 0 && files.every((file) => $selectedFileIds.has(file.id))
	);

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

	$effect(() => {
		const key = `${$currentWorkspace?.id ?? 'none'}|${$currentFolder?.id ?? 'root'}|${$currentView}`;
		if (key !== selectionContextKey) {
			selectedFileIds.set(new Set());
			selectionContextKey = key;
		}
	});

	// Keyboard shortcuts: Ctrl+C (copy), Ctrl+V (paste), Ctrl+X (cut/trash)
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const isMac =
				typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			// Ctrl/Cmd + C: Copy selected files to clipboard
			if (modKey && e.key === 'c') {
				e.preventDefault();
				const selectedIds = Array.from($selectedFileIds);
				if (selectedIds.length > 0) {
					clipboard.set({
						type: 'file',
						ids: selectedIds
					});
					selectedFileIds.set(new Set()); // Clear selection
					toast.success(
						`Copied ${selectedIds.length} file${selectedIds.length === 1 ? '' : 's'} to clipboard`
					);
				}
			}

			// Ctrl/Cmd + V: Paste clipboard contents to current folder
			if (modKey && e.key === 'v') {
				e.preventDefault();
				const clipboardData = $clipboard;
				if (!clipboardData || !$currentWorkspace) return;

				try {
					if (clipboardData.type === 'file') {
						copyFilesToFolder(clipboardData.ids, $currentFolder?.id ?? null);
						clipboard.clear();
						toast.success(
							`Pasted ${clipboardData.ids.length} file${clipboardData.ids.length === 1 ? '' : 's'}`
						);
					} else if (clipboardData.type === 'folder') {
						copyFoldersToFolder(clipboardData.ids, $currentFolder?.id ?? null);
						clipboard.clear();
						toast.success(
							`Pasted ${clipboardData.ids.length} folder${clipboardData.ids.length === 1 ? '' : 's'}`
						);
					}
				} catch (e) {
					console.error('Paste failed:', e);
					toast.error('Paste failed');
				}
			}

			// Ctrl/Cmd + X: Move selected files to trash
			if (modKey && e.key === 'x') {
				e.preventDefault();
				const selectedIds = Array.from($selectedFileIds);
				if (selectedIds.length > 0) {
					showBulkTrashConfirm = true;
					pendingMoveIds = selectedIds;
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	// Copy/paste handlers for context menu
	function handleCopyFile(fileId: string) {
		clipboard.set({
			type: 'file',
			ids: [fileId]
		});
		toast.success('Copied to clipboard');
	}

	function handleCopyFolder(folderId: string) {
		clipboard.set({
			type: 'folder',
			ids: [folderId]
		});
		toast.success('Copied to clipboard');
	}

	function handlePaste(targetFolderId: string | null) {
		const clipboardData = $clipboard;
		if (!clipboardData || !$currentWorkspace) return;

		try {
			if (clipboardData.type === 'file') {
				copyFilesToFolder(clipboardData.ids, targetFolderId);
				clipboard.clear();
				toast.success(
					`Pasted ${clipboardData.ids.length} file${clipboardData.ids.length === 1 ? '' : 's'}`
				);
			} else if (clipboardData.type === 'folder') {
				copyFoldersToFolder(clipboardData.ids, targetFolderId);
				clipboard.clear();
				toast.success(
					`Pasted ${clipboardData.ids.length} folder${clipboardData.ids.length === 1 ? '' : 's'}`
				);
			}
		} catch (e) {
			console.error('Paste failed:', e);
			toast.error('Paste failed');
		}
	}

	function openMoveModal() {
		if ($selectedFileIds.size === 0) return;
		moveTargetWorkspaceId = $currentWorkspace?.id ?? '';
		moveTargetFolderId = '';
		moveError = '';
		showMoveConfirm = false;
		pendingMoveIds = [];
		showMoveModal = true;
	}

	function performMove(targetWs: string, targetFolder: string | null, ids: string[]) {
		try {
			if ($currentWorkspace && targetWs !== $currentWorkspace.id) {
				moveFilesToWorkspace(ids, targetWs, targetFolder);
			} else {
				moveFilesToFolder(ids, targetFolder, { targetWorkspaceId: targetWs });
			}
			selectedFileIds.set(new Set());
			showMoveModal = false;
			showMoveConfirm = false;
			pendingMoveIds = [];
		} catch (e) {
			moveError = (e as Error).message;
		}
	}

	function confirmMove() {
		const ids = Array.from($selectedFileIds);
		if (ids.length === 0) return;

		const targetWs = moveTargetWorkspaceId || $currentWorkspace?.id;
		const targetFolder = moveTargetFolderId || null;

		if (!targetWs) {
			moveError = 'Select a workspace.';
			return;
		}

		const isCrossWorkspace = Boolean($currentWorkspace && targetWs !== $currentWorkspace.id);
		if (isCrossWorkspace) {
			showMoveConfirm = true;
			return;
		}

		performMove(targetWs, targetFolder, ids);
	}

	function openTagModal() {
		if ($selectedFileIds.size === 0) return;
		tagError = '';
		bulkSelectedTags = new Set();
		bulkPendingTagNames = [];
		showTagModal = true;
	}

	function confirmAddTags() {
		const ids = Array.from($selectedFileIds);
		if (ids.length === 0) return;
		const wsId = $currentWorkspace?.id;
		if (!wsId) {
			tagError = 'No workspace selected.';
			return;
		}

		const names = [...Array.from(bulkSelectedTags), ...bulkPendingTagNames]
			.map((n) => n.trim())
			.filter(Boolean);

		if (names.length === 0) {
			tagError = 'Add at least one tag name.';
			return;
		}

		try {
			addTagsToFiles(ids, wsId, names);
			showTagModal = false;
		} catch (e) {
			tagError = (e as Error).message;
		}
	}

	function handleSelectBulkTag(event: CustomEvent<{ id: string; label: string }>) {
		const name = event.detail.label.trim();
		if (!name) return;
		const next = new Set(bulkSelectedTags);
		next.add(name);
		bulkSelectedTags = next;
	}

	function handleCreateBulkTag(label: string) {
		const name = label.trim();
		if (!name) return;
		if (bulkPendingTagNames.some((n) => n.toLowerCase() === name.toLowerCase())) return;
		bulkPendingTagNames = [...bulkPendingTagNames, name];
	}

	function removeSelectedBulkTag(name: string) {
		const next = new Set(bulkSelectedTags);
		next.delete(name);
		bulkSelectedTags = next;
	}

	function removePendingBulkTag(name: string) {
		bulkPendingTagNames = bulkPendingTagNames.filter((n) => n.toLowerCase() !== name.toLowerCase());
	}

	function confirmCrossWorkspaceMove() {
		const ids = pendingMoveIds.length > 0 ? pendingMoveIds : Array.from($selectedFileIds);
		if (ids.length === 0) return;
		const targetWs = moveTargetWorkspaceId || $currentWorkspace?.id;
		const targetFolder = moveTargetFolderId || null;
		if (!targetWs) {
			moveError = 'Select a workspace.';
			showMoveConfirm = false;
			return;
		}
		performMove(targetWs, targetFolder, ids);
	}

	function cancelMoveConfirm() {
		showMoveConfirm = false;
		pendingMoveIds = [];
	}

	function cancelBulkTrash() {
		showBulkTrashConfirm = false;
	}

	function handleBulkTrash() {
		const ids = Array.from($selectedFileIds);
		if (ids.length === 0) return;
		showBulkTrashConfirm = true;
	}

	function handleBulkRestore() {
		const ids = Array.from($selectedFileIds);
		if (ids.length === 0) return;
		ids.forEach((id) => restoreFile(id));
		selectedFileIds.set(new Set());
	}

	function confirmBulkTrash() {
		const ids = Array.from($selectedFileIds);
		if (ids.length === 0) return;
		deleteFiles(ids);
		selectedFileIds.set(new Set());
		showBulkTrashConfirm = false;
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
		if (mimeType.startsWith('video/')) return FileVideoCamera as unknown as IconComponent;
		if (mimeType.includes('pdf')) return FileText as unknown as IconComponent;
		return FileIcon as unknown as IconComponent;
	}

	const buildFolderPath = (folderId: string | null) =>
		buildFolderPathUtil(folderId, $workspaceFolders);

	const getWorkspaceName = (id: string | null | undefined) =>
		getWorkspaceNameUtil(id, availableWorkspaces);

	const formatDate = (date: Date | string) => formatDateShort(date);

	const formatTrashExpiry = (item: File | Folder) =>
		formatTrashExpiryUtil(item, TRASH_RETENTION_DAYS, formatDate);

	const getTagClass = (tagId: string) => getTagClassUtil(tagId, tagMap);

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

	function handleFilePointerDown(event: PointerEvent, fileId: string) {
		dragController.pointerDown(fileId, { x: event.clientX, y: event.clientY });
		dragArmingId = fileId;
	}

	function handleFilePointerMove(event: PointerEvent) {
		dragController.pointerMove({ x: event.clientX, y: event.clientY });
	}

	function handleFilePointerEnd() {
		dragController.pointerEnd();
		dragArmingId = null;
	}

	function handleFileDragStart(event: DragEvent, fileId: string) {
		if (!dragController.isReady(fileId)) {
			event.preventDefault();
			return;
		}

		setDragImageFromTarget(event);
		const payload = buildDragPayload(fileId, $selectedFileIds, 'file');
		setDragData(event, payload);
		dragArmingId = null;
	}

	function handleFolderPointerDown(event: PointerEvent, folderId: string) {
		folderDragController.pointerDown(folderId, { x: event.clientX, y: event.clientY });
		folderDragArmingId = folderId;
	}

	function handleFolderPointerMove(event: PointerEvent) {
		folderDragController.pointerMove({ x: event.clientX, y: event.clientY });
	}

	function handleFolderPointerEnd() {
		folderDragController.pointerEnd();
		folderDragArmingId = null;
	}

	function handleFolderItemDragStart(event: DragEvent, folderId: string) {
		if (!folderDragController.isReady(folderId)) {
			event.preventDefault();
			return;
		}

		setDragImageFromTarget(event);
		const payload = buildDragPayload(folderId, new Set(), 'folder');
		setDragData(event, payload);
		folderDragArmingId = null;
	}

	function handleFolderDragOver(event: DragEvent, key?: string) {
		allowMoveDrop(event);
		if (key) activeFolderDropKey = key;
	}

	function handleFolderDragLeave(key?: string) {
		if (!key || activeFolderDropKey === key) {
			activeFolderDropKey = null;
		}
	}

	function handleFolderDrop(event: DragEvent, folderId: string | null) {
		activeFolderDropKey = null;
		allowMoveDrop(event);
		const parsed = parseDragData(event);
		if (!parsed?.ids?.length) return;

		if (parsed.type === 'file') {
			dropFilesToFolder(parsed.ids, folderId);
		} else if (parsed.type === 'folder') {
			dropFoldersToFolder(parsed.ids, folderId);
		}
	}

	function dropFilesToFolder(ids: string[], folderId: string | null) {
		const folder = folderId ? $workspaceFolders.find((f) => f.id === folderId) : null;
		const targetWorkspaceId = folder?.workspaceId ?? $currentWorkspace?.id;
		if (!targetWorkspaceId) return;
		const targetFolderId = folderId ?? null;

		const isCrossWorkspace = $currentWorkspace && targetWorkspaceId !== $currentWorkspace.id;
		if (isCrossWorkspace) {
			pendingMoveIds = ids;
			moveTargetWorkspaceId = targetWorkspaceId;
			moveTargetFolderId = targetFolderId ?? '';
			showMoveConfirm = true;
			return;
		}

		performMove(targetWorkspaceId, targetFolderId, ids);
	}

	function getDescendantFolderIds(allFolders: Folder[], folderId: string): Set<string> {
		const descendants = new Set<string>();
		const stack = [folderId];
		while (stack.length > 0) {
			const current = stack.pop();
			if (!current) continue;
			const children = allFolders.filter((f) => f.parentId === current && !f.deletedAt);
			for (const child of children) {
				if (!descendants.has(child.id)) {
					descendants.add(child.id);
					stack.push(child.id);
				}
			}
		}
		return descendants;
	}

	function dropFoldersToFolder(folderIds: string[], targetFolderId: string | null) {
		const targetFolder = targetFolderId
			? $workspaceFolders.find((f) => f.id === targetFolderId)
			: null;
		const targetWorkspaceId = targetFolder?.workspaceId ?? $currentWorkspace?.id;
		if (!targetWorkspaceId) return;

		// Prevent moving into itself or descendant
		const allFolders = $workspaceFolders;
		for (const folderId of folderIds) {
			if (folderId === targetFolderId) {
				alert('Cannot move a folder into itself');
				return;
			}
			if (targetFolderId) {
				const descendants = getDescendantFolderIds(allFolders, folderId);
				if (descendants.has(targetFolderId)) {
					alert('Cannot move a folder into its own descendant.');
					return;
				}
			}
		}

		const isCrossWorkspace = $currentWorkspace && targetWorkspaceId !== $currentWorkspace.id;

		if (isCrossWorkspace) {
			// Cross-workspace folder move - show confirmation
			pendingMoveIds = folderIds;
			moveTargetWorkspaceId = targetWorkspaceId;
			moveTargetFolderId = targetFolderId ?? '';
			showMoveConfirm = true;
			return;
		}

		// Same workspace move
		try {
			for (const folderId of folderIds) {
				moveFolder(folderId, targetFolderId);
			}
		} catch (error) {
			alert((error as Error).message);
		}
	}
</script>

<svelte:window
	onkeydown={handleKeydown}
	ondragend={() => (activeFolderDropKey = null)}
	ondrop={() => (activeFolderDropKey = null)}
/>

{#if $selectedFileIds.size > 0}
	<div
		in:fly={{ y: 20, duration: 200 }}
		out:fly={{ y: 20, duration: 150 }}
		class="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg border border-accent bg-accent/95 p-4 shadow-lg backdrop-blur-sm"
	>
		<span class="text-sm font-medium text-accent-foreground"
			>{$selectedFileIds.size} file{$selectedFileIds.size !== 1 ? 's' : ''} selected</span
		>
		<div class="flex flex-wrap items-center gap-2">
			{#if isTrashView}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 gap-1 px-2 text-accent-foreground hover:bg-accent/80"
					onclick={handleBulkRestore}
				>
					<RotateCcw class="h-4 w-4" />
					Restore
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 gap-1 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
					onclick={handleBulkTrash}
				>
					<Trash2 class="h-4 w-4" />
					Trash
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 gap-1 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
				onclick={() => {
					const selectedIds = Array.from($selectedFileIds);
					if (selectedIds.length > 0) {
						clipboard.set({
							type: 'file',
							ids: selectedIds
						});
						selectedFileIds.set(new Set()); // Clear selection
						toast.success(
							`Copied ${selectedIds.length} file${selectedIds.length === 1 ? '' : 's'} to clipboard`
						);
					}
				}}
			>
				<Copy class="h-4 w-4" />
				Copy
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-8 gap-1 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
				onclick={openMoveModal}
			>
				<FolderUp class="h-4 w-4" />
				Move
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-8 gap-1 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
				onclick={openTagModal}
			>
				<Tag class="h-4 w-4" />
				Add Tags
			</Button>
			{#if allVisibleSelected}
				<Button variant="ghost" size="sm" class="h-8 px-2 text-accent-foreground" disabled>
					All selected
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
					onclick={selectAll}
				>
					Select All
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 px-2 text-accent-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
				onclick={clearSelection}
			>
				<X class="h-4 w-4" />
				Clear
			</Button>
		</div>
	</div>
{/if}

<Dialog bind:open={showMoveModal}>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle>Move files</DialogTitle>
			<DialogDescription>
				Choose a destination workspace and folder. Cross-workspace moves will ask for confirmation.
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4">
			<div class="space-y-2">
				<label
					for="move-workspace"
					class="flex items-center gap-2 text-sm font-medium text-foreground"
				>
					<Building2 class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
					<span>Workspace</span>
				</label>
				<select
					id="move-workspace"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
					bind:value={moveTargetWorkspaceId}
				>
					{#each availableWorkspaces as ws}
						<option value={ws.id}>{ws.name}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<label
					for="move-folder"
					class="flex items-center gap-2 text-sm font-medium text-foreground"
				>
					<FolderIconOutline class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
					<span>Folder</span>
				</label>
				<select
					id="move-folder"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
					bind:value={moveTargetFolderId}
				>
					<option value="">Workspace Root</option>
					{#each moveFolderOptions as folder}
						<option value={folder.id}>{buildFolderPath(folder.id)}</option>
					{/each}
				</select>
			</div>
			{#if moveError}
				<p class="text-sm text-destructive">{moveError}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (showMoveModal = false)}>Cancel</Button>
			<Button onclick={confirmMove}>Move</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={showMoveConfirm}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Move to another workspace?</DialogTitle>
			<DialogDescription>
				Move {pendingMoveIds.length || $selectedFileIds.size}
				file{(pendingMoveIds.length || $selectedFileIds.size) === 1 ? '' : 's'} from
				{getWorkspaceName($currentWorkspace?.id)} to {getWorkspaceName(moveTargetWorkspaceId)}?
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={cancelMoveConfirm}>Cancel</Button>
			<Button variant="destructive" onclick={confirmCrossWorkspaceMove}>Move</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={showTagModal}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Add tags to files</DialogTitle>
			<DialogDescription>Search existing tags or type to create new ones.</DialogDescription>
		</DialogHeader>
		<div class="space-y-3">
			{#if bulkSelectedTags.size > 0 || bulkPendingTagNames.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each Array.from(bulkSelectedTags) as name (name)}
						<span
							class="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground"
						>
							{name}
							<button
								type="button"
								class="text-muted-foreground"
								onclick={() => removeSelectedBulkTag(name)}
							>
								<X class="h-3 w-3" />
							</button>
						</span>
					{/each}
					{#each bulkPendingTagNames as name (name)}
						<span
							class="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground"
						>
							{name}
							<button
								type="button"
								class="text-accent-foreground/80"
								onclick={() => removePendingBulkTag(name)}
							>
								<X class="h-3 w-3" />
							</button>
						</span>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No tags selected</p>
			{/if}

			<Combobox
				items={availableTagOptions}
				placeholder="Search or create tags"
				emptyMessage="No matches — press Enter to create"
				on:select={handleSelectBulkTag}
				on:create={(event) => handleCreateBulkTag(event.detail.label)}
			/>

			{#if tagError}
				<p class="text-sm text-destructive">{tagError}</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (showTagModal = false)}>Cancel</Button>
			<Button onclick={confirmAddTags}>Add Tags</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={showBulkTrashConfirm}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Move to Trash</DialogTitle>
			<DialogDescription>
				Move {$selectedFileIds.size} file{$selectedFileIds.size === 1 ? '' : 's'} to Trash? Items remain
				recoverable for 30 days.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={cancelBulkTrash}>Cancel</Button>
			<Button variant="destructive" onclick={confirmBulkTrash}>Move to Trash</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

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
		activeDropTargetKey={activeFolderDropKey}
		clipboard={$clipboard}
		{formatFileSize}
		{formatDate}
		{formatTrashExpiry}
		{getFileIconComponent}
		{getTagClass}
		{dragArmingId}
		{folderDragArmingId}
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
		onFilePointerDown={handleFilePointerDown}
		onFilePointerMove={handleFilePointerMove}
		onFilePointerEnd={handleFilePointerEnd}
		onFileDragStart={handleFileDragStart}
		onFolderPointerDown={handleFolderPointerDown}
		onFolderPointerMove={handleFolderPointerMove}
		onFolderPointerEnd={handleFolderPointerEnd}
		onFolderItemDragStart={handleFolderItemDragStart}
		onFolderDragOver={handleFolderDragOver}
		onFolderDragLeave={handleFolderDragLeave}
		onFolderDrop={handleFolderDrop}
		onCopyFile={handleCopyFile}
		onCopyFolder={handleCopyFolder}
		onPaste={handlePaste}
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
		activeDropTargetKey={activeFolderDropKey}
		clipboard={$clipboard}
		{formatFileSize}
		{formatDate}
		{formatTrashExpiry}
		{getFileIconComponent}
		{getTagClass}
		{dragArmingId}
		{folderDragArmingId}
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
		onFilePointerDown={handleFilePointerDown}
		onFilePointerMove={handleFilePointerMove}
		onFilePointerEnd={handleFilePointerEnd}
		onFileDragStart={handleFileDragStart}
		onFolderPointerDown={handleFolderPointerDown}
		onFolderPointerMove={handleFolderPointerMove}
		onFolderPointerEnd={handleFolderPointerEnd}
		onFolderItemDragStart={handleFolderItemDragStart}
		onFolderDragOver={handleFolderDragOver}
		onFolderDragLeave={handleFolderDragLeave}
		onFolderDrop={handleFolderDrop}
		onCopyFile={handleCopyFile}
		onCopyFolder={handleCopyFolder}
		onPaste={handlePaste}
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
