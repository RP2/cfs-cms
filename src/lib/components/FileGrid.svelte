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
	import { mockFiles, getFilesForFolder, getSubfolders } from '$lib/data/mock';
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
		Folder as FolderIcon
	} from '@lucide/svelte';

	let files = $state<File[]>([]);
	let folders = $state<Folder[]>([]);

	let showNewFolderModal = $state(false);
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

	function openNewFolder() {
		showNewFolderModal = true;
	}

	function openUpload() {
		showUploadModal = true;
	}
</script>

{#if $viewType === 'grid'}
	<!-- Grid View -->
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<div class="min-h-screen space-y-4 p-6">
				<!-- Show folders at workspace root, files inside folders -->
				{#if !$currentFolder && folders.length > 0}
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
										<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
										<ContextMenu.Item onselect={() => openRename(folder, 'folder')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onselect={() => openDelete(folder, 'folder')}
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
											<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
											<ContextMenu.Item onselect={() => openRename(folder, 'folder')}
												>Rename</ContextMenu.Item
											>
											<ContextMenu.Item
												variant="destructive"
												onselect={() => openDelete(folder, 'folder')}
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
												<!-- Checkbox on hover -->
												<div
													class="absolute top-2 left-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
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
										<ContextMenu.Item onselect={() => ensureFileSelection(file.id)}
											>Select</ContextMenu.Item
										>
										<ContextMenu.Item onselect={() => openRename(file, 'file')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onselect={() => openDelete(file, 'file')}
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
			<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
			<ContextMenu.Item onselect={openUpload}>Upload Files</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{:else}
	<!-- List View -->
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<div class="min-h-screen p-6">
				{#if !$currentFolder && folders.length > 0}
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
										<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
										<ContextMenu.Item onselect={() => openRename(folder, 'folder')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onselect={() => openDelete(folder, 'folder')}
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
											<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
											<ContextMenu.Item onselect={() => openRename(folder, 'folder')}
												>Rename</ContextMenu.Item
											>
											<ContextMenu.Item
												variant="destructive"
												onselect={() => openDelete(folder, 'folder')}
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
						<h3
							class="mb-3 text-sm font-medium text-muted-foreground"
							class:mt-6={folders.length > 0}
						>
							FILES
						</h3>
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
										<ContextMenu.Item onselect={() => ensureFileSelection(file.id)}
											>Select</ContextMenu.Item
										>
										<ContextMenu.Item onselect={() => openRename(file, 'file')}
											>Rename</ContextMenu.Item
										>
										<ContextMenu.Item
											variant="destructive"
											onselect={() => openDelete(file, 'file')}
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
						<p class="text-muted-foreground">No files found</p>
					</div>
				{/if}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item onselect={openNewFolder}>New Folder</ContextMenu.Item>
			<ContextMenu.Item onselect={openUpload}>Upload Files</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}

<NewFolderModal bind:open={showNewFolderModal} />
<RenameModal bind:open={showRenameModal} item={renameTarget} itemType={renameType} />
<DeleteConfirmModal bind:open={showDeleteModal} item={deleteTarget} itemType={deleteType} />
<UploadModal bind:open={showUploadModal} />

<style>
	/* Ensure CardFooter exists */
	:global(.card-footer) {
		display: flex;
		flex-direction: column;
	}
</style>
