<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import NewFolderModal from './modals/NewFolderModal.svelte';
	import RenameModal from './modals/RenameModal.svelte';
	import DeleteConfirmModal from './modals/DeleteConfirmModal.svelte';
	import UploadModal from './modals/UploadModal.svelte';
	import {
		currentFiles,
		currentFolder,
		currentWorkspace,
		workspaceFolders,
		selectedFileIds,
		viewType
	} from '$lib/stores';
	import type { File, Folder } from '$lib/types';
	import {
		File as FileIcon,
		FileImage,
		FileVideo,
		FileText,
		Plus,
		Upload,
		MoreVertical,
		Edit2,
		Trash2,
		Package,
		Calendar,
		FolderOpen,
		Folder as FolderIcon,
		X
	} from '@lucide/svelte';

	let files = $state<File[]>([]);
	let folders = $state<Folder[]>([]);
	let isLoading = $state(true);

	let showNewFolderModal = $state(false);
	let parentFolderId = $state<string | null>(null); // For creating subfolders
	let showRenameModal = $state(false);
	let showDeleteModal = $state(false);
	let showUploadModal = $state(false);

	let renameTarget = $state<File | Folder | null>(null);
	let renameType = $state<'file' | 'folder'>('file');
	let deleteTarget = $state<File | Folder | null>(null);
	let deleteType = $state<'file' | 'folder'>('file');

	// Derived files: filter from store based on current folder AND workspace
	let derivedFiles = $derived.by(() => {
		if (!$currentFolder || !$currentWorkspace) return [];
		return $currentFiles.filter(
			(f) =>
				f.folderId === $currentFolder.id && f.workspaceId === $currentWorkspace.id && !f.deletedAt
		);
	});

	// Derived folders: filter from store based on parent folder, workspace, AND current level
	let derivedFolders = $derived.by(() => {
		if (!$currentWorkspace) return [];
		const parentId = $currentFolder?.id || null;
		return $workspaceFolders.filter(
			(f) => f.parentId === parentId && f.workspaceId === $currentWorkspace.id && !f.deletedAt
		);
	});

	// Sync derived data to local state for display
	$effect(() => {
		files = derivedFiles;
		folders = derivedFolders;
	});

	// Set loading state: show skeletons for 300ms minimum so user sees them (simulates network delay)
	$effect(() => {
		isLoading = true;
		const timer = setTimeout(() => {
			isLoading = false;
		}, 300);
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
		currentFolder.set(folder);
	}

	function getFileIconComponent(mimeType: string) {
		if (mimeType.startsWith('image/')) return FileImage;
		if (mimeType.startsWith('video/')) return FileVideo;
		if (mimeType.includes('pdf')) return FileText;
		return FileIcon;
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

	function ensureFileSelection(fileId: string) {
		const next = new Set($selectedFileIds);
		if (!next.has(fileId)) {
			next.clear();
			next.add(fileId);
			selectedFileIds.set(next);
		}
	}

	function openRename(item: File | Folder, type: 'file' | 'folder') {
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

	function selectAll() {
		const allIds = new Set(files.map((f) => f.id));
		selectedFileIds.set(allIds);
	}

	function clearSelection() {
		selectedFileIds.set(new Set());
	}

	// Keyboard shortcuts
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
	<!-- Floating Selection Counter at Bottom Right -->
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
	<!-- Grid View -->
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<div class="min-h-screen space-y-4 p-6">
				{#if isLoading}
					<!-- Loading Spinner -->
					<div class="flex min-h-96 items-center justify-center">
						<Spinner />
					</div>
				{:else if !$currentFolder && folders.length > 0}
					<!-- Workspace Root: Display Folders -->
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each folders as folder (folder.id)}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div class="group h-full">
											<Card
												class="relative h-full cursor-pointer transition-shadow hover:shadow-lg"
												onclick={() => navigateToFolder(folder)}
											>
												<CardContent class="h-full p-4">
													<!-- Folder Icon -->
													<div class="mb-2 flex justify-center">
														<FolderIcon class="h-12 w-12 text-accent" />
													</div>

													<!-- Folder Name -->
													<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">
														{folder.name}
													</h3>

													<!-- Folder Description -->
													{#if folder.description}
														<p class="line-clamp-2 text-center text-xs text-muted-foreground">
															{folder.description}
														</p>
													{/if}
												</CardContent>
											</Card>
										</div>
									</ContextMenu.Trigger>
									<ContextMenu.Content>
										<ContextMenu.Item onclick={() => openNewFolder(folder.id)}
											>New Folder</ContextMenu.Item
										>
										<ContextMenu.Item onclick={() => openRename(folder, 'folder')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onclick={() => openDelete(folder, 'folder')}
										>
											Delete
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Root>
							{/each}
						</div>
					</div>
				{:else if $currentFolder && (folders.length > 0 || files.length > 0)}
					<!-- Inside Folder: Display Both Subfolders and Files -->
					<!-- Subfolders -->
					{#if folders.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
								{#each folders as folder (folder.id)}
									<ContextMenu.Root>
										<ContextMenu.Trigger>
											<div class="group h-full">
												<Card
													class="relative h-full cursor-pointer transition-shadow hover:shadow-lg"
													onclick={() => navigateToFolder(folder)}
												>
													<CardContent class="h-full p-4">
														<div class="mb-2 flex justify-center">
															<FolderIcon class="h-12 w-12 text-accent" />
														</div>
														<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">
															{folder.name}
														</h3>
														{#if folder.description}
															<p class="line-clamp-2 text-center text-xs text-muted-foreground">
																{folder.description}
															</p>
														{/if}
													</CardContent>
												</Card>
											</div>
										</ContextMenu.Trigger>
										<ContextMenu.Content>
											<ContextMenu.Item onclick={() => openNewFolder(folder.id)}
												>New Folder</ContextMenu.Item
											>
											<ContextMenu.Item onclick={() => openRename(folder, 'folder')}
												>Rename</ContextMenu.Item
											>
											<ContextMenu.Item
												variant="destructive"
												onclick={() => openDelete(folder, 'folder')}
											>
												Delete
											</ContextMenu.Item>
										</ContextMenu.Content>
									</ContextMenu.Root>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Files -->
					{#if files.length > 0}
						<h3
							class="mb-3 text-sm font-medium text-muted-foreground"
							class:mt-6={folders.length > 0}
						>
							FILES
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each files as file (file.id)}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div class="group h-full">
											<Card
												class="relative h-full cursor-pointer transition-shadow hover:shadow-lg"
											>
												<!-- Checkbox always visible when selected, visible on hover otherwise -->
												<div
													class="absolute top-2 left-2 z-10 transition-opacity"
													class:opacity-100={$selectedFileIds.has(file.id)}
													class:opacity-0={!$selectedFileIds.has(file.id)}
													class:group-hover:opacity-100={!$selectedFileIds.has(file.id)}
												>
													<Checkbox
														checked={$selectedFileIds.has(file.id)}
														onCheckedChange={() => toggleFileSelect(file.id)}
													/>
												</div>

												<CardContent class="h-full p-4">
													<!-- File Icon/Preview -->
													<div class="mb-2 flex justify-center">
														{#if true}
															{@const Icon = getFileIconComponent(file.mimeType)}
															<Icon class="h-12 w-12 text-muted-foreground" />
														{/if}
													</div>

													<!-- File Name -->
													<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">
														{file.name}
													</h3>

													<!-- File Info -->
													<div
														class="flex items-center justify-center gap-2 text-xs text-muted-foreground"
													>
														<div class="flex items-center gap-1">
															<Package class="h-3 w-3" />
															{formatFileSize(file.size)}
														</div>
														<span>•</span>
														<div class="flex items-center gap-1">
															<Calendar class="h-3 w-3" />
															{formatDate(file.createdAt)}
														</div>
													</div>

													<!-- Tags -->
													{#if file.tagIds && file.tagIds.length > 0}
														<div class="mt-2 flex flex-wrap justify-center gap-1">
															{#each file.tagIds as tagId}
																<Badge variant="secondary">Tag</Badge>
															{/each}
														</div>
													{/if}
												</CardContent>
											</Card>
										</div>
									</ContextMenu.Trigger>
									<ContextMenu.Content>
										<ContextMenu.Item onclick={() => toggleFileSelect(file.id)}>
											{$selectedFileIds.has(file.id) ? 'Deselect' : 'Select'}
										</ContextMenu.Item>
										<ContextMenu.Item onclick={() => openRename(file, 'file')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onclick={() => openDelete(file, 'file')}
										>
											Delete
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Root>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="py-12 text-center">
						<div class="mb-4 flex justify-center">
							<FolderOpen class="h-16 w-16 text-muted-foreground" />
						</div>
						<p class="text-muted-foreground">
							{$currentFolder ? 'This folder is empty' : 'No files yet'}
						</p>
						<p class="text-sm text-muted-foreground">
							Upload files or create folders to get started
						</p>
					</div>
				{/if}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item onclick={() => openNewFolder()}>New Folder</ContextMenu.Item>
			<ContextMenu.Item onclick={openUpload}>Upload Files</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{:else}
	<!-- List View -->
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<div class="min-h-screen p-6">
				{#if isLoading}
					<!-- Loading Skeletons -->
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">LOADING</h3>
						<div class="space-y-2">
							{#each Array(6) as _}
								<div class="flex items-center gap-3 rounded border p-3">
									<Skeleton class="h-5 w-5 rounded" />
									<Skeleton class="h-5 w-5 rounded" />
									<div class="flex-1">
										<Skeleton class="mb-1 h-4 w-40 rounded" />
										<Skeleton class="h-3 w-60 rounded" />
									</div>
									<Skeleton class="h-8 w-8 rounded" />
								</div>
							{/each}
						</div>
					</div>
				{:else if !$currentFolder && folders.length > 0}
					<!-- Workspace Root: Display Folders -->
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
						<div class="space-y-2">
							{#each folders as folder (folder.id)}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<button
											type="button"
											class="flex w-full cursor-pointer items-center gap-3 rounded border p-3 text-left transition-colors hover:bg-muted"
											onclick={() => navigateToFolder(folder)}
										>
											<FolderIcon class="h-6 w-6 text-accent" />
											<div class="flex-1">
												<p class="font-medium">{folder.name}</p>
												{#if folder.description}
													<p class="text-sm text-muted-foreground">{folder.description}</p>
												{/if}
											</div>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
											</Button>
										</button>
									</ContextMenu.Trigger>
									<ContextMenu.Content>
										<ContextMenu.Item onclick={() => openNewFolder(folder.id)}
											>New Folder</ContextMenu.Item
										>
										<ContextMenu.Item onclick={() => openRename(folder, 'folder')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onclick={() => openDelete(folder, 'folder')}
										>
											Delete
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Root>
							{/each}
						</div>
					</div>
				{:else if $currentFolder && (folders.length > 0 || files.length > 0)}
					<!-- Inside Folder: Display Both Subfolders and Files -->
					{#if folders.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
							<div class="space-y-2">
								{#each folders as folder (folder.id)}
									<ContextMenu.Root>
										<ContextMenu.Trigger>
											<button
												type="button"
												class="flex w-full cursor-pointer items-center gap-3 rounded border p-3 text-left transition-colors hover:bg-muted"
												onclick={() => navigateToFolder(folder)}
											>
												<FolderIcon class="h-6 w-6 text-accent" />
												<div class="flex-1">
													<p class="font-medium">{folder.name}</p>
													{#if folder.description}
														<p class="text-sm text-muted-foreground">{folder.description}</p>
													{/if}
												</div>
												<Button variant="ghost" size="icon">
													<MoreVertical class="h-4 w-4" />
												</Button>
											</button>
										</ContextMenu.Trigger>
										<ContextMenu.Content>
											<ContextMenu.Item onclick={() => openNewFolder(folder.id)}
												>New Folder</ContextMenu.Item
											>
											<ContextMenu.Item onclick={() => openRename(folder, 'folder')}
												>Rename</ContextMenu.Item
											>
											<ContextMenu.Item
												variant="destructive"
												onclick={() => openDelete(folder, 'folder')}
											>
												Delete
											</ContextMenu.Item>
										</ContextMenu.Content>
									</ContextMenu.Root>
								{/each}
							</div>
						</div>
					{/if}

					{#if files.length > 0}
						<div class="space-y-2">
							{#each files as file (file.id)}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div class="flex items-center gap-3 rounded border p-3 hover:bg-muted">
											<Checkbox
												checked={$selectedFileIds.has(file.id)}
												onCheckedChange={() => toggleFileSelect(file.id)}
											/>
											{#if true}
												{@const Icon = getFileIconComponent(file.mimeType)}
												<Icon class="h-6 w-6 text-muted-foreground" />
											{/if}
											<div class="flex-1">
												<p class="font-medium">{file.name}</p>
												<p class="text-sm text-muted-foreground">
													{formatFileSize(file.size)} • {formatDate(file.createdAt)}
												</p>
											</div>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
											</Button>
										</div>
									</ContextMenu.Trigger>
									<ContextMenu.Content>
										<ContextMenu.Item onclick={() => toggleFileSelect(file.id)}>
											{$selectedFileIds.has(file.id) ? 'Deselect' : 'Select'}
										</ContextMenu.Item>
										<ContextMenu.Item onclick={() => openRename(file, 'file')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onclick={() => openDelete(file, 'file')}
										>
											Delete
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Root>
							{/each}
						</div>
					{/if}
				{:else}
					<!-- Empty State -->
					<div class="py-12 text-center">
						<div class="mb-4 flex justify-center">
							<FolderOpen class="h-16 w-16 text-muted-foreground" />
						</div>
						<p class="text-muted-foreground">
							{$currentFolder ? 'This folder is empty' : 'No files yet'}
						</p>
						<p class="text-sm text-muted-foreground">
							Upload files or create folders to get started
						</p>
					</div>
				{/if}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item onclick={() => openNewFolder()}>New Folder</ContextMenu.Item>
			<ContextMenu.Item onclick={openUpload}>Upload Files</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}

<NewFolderModal bind:open={showNewFolderModal} bind:parentFolderId />
<RenameModal bind:open={showRenameModal} bind:item={renameTarget} bind:itemType={renameType} />
<DeleteConfirmModal
	bind:open={showDeleteModal}
	bind:item={deleteTarget}
	bind:itemType={deleteType}
/>
<UploadModal bind:open={showUploadModal} />

<style>
	/* Ensure CardFooter exists */
	:global(.card-footer) {
		display: flex;
		flex-direction: column;
	}
</style>
