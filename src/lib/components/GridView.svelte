<script lang="ts">
	// Note: use native on* attributes (ondragover/ondrop/ondragstart) instead of on: syntax here to avoid Svelte 5 warnings.
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import {
		File as FileIcon,
		FileImage,
		FileVideo,
		FileText,
		Trash,
		Star,
		RotateCcw,
		Package,
		Calendar,
		FolderOpen,
		Folder as FolderIcon
	} from '@lucide/svelte';
	import type { SvelteComponent } from 'svelte';
	import type { File, Folder, Tag, Workspace, ViewMode } from '$lib/types';
	import { buildBackgroundMenu, buildFileMenu, buildFolderMenu } from './context-menus/menuBuilder';
	import MenuContent from './context-menus/MenuContent.svelte';

	type IconComponent = typeof SvelteComponent;

	interface Props {
		isTrashView: boolean;
		isLoading: boolean;
		currentFolder: Folder | null;
		currentView: ViewMode;
		folders: Folder[];
		files: File[];
		tagHeading: string;
		tagMap: Map<string, Tag>;
		selectedFileIds: Set<string>;
		deletedWorkspaces: Workspace[];
		trashRetentionDays: number;
		activeDropTargetKey: string | null;
		clipboard: { type: 'file' | 'folder'; ids: string[] } | null;
		formatFileSize: (size: number) => string;
		formatDate: (date: Date) => string;
		formatTrashExpiry: (item: File | Folder) => string | null;
		getFileIconComponent: (mimeType: string) => IconComponent;
		getTagClass: (tagId: string) => string;
		dragArmingId: string | null;
		folderDragArmingId: string | null;
		onNavigateToFolder: (folder: Folder) => void;
		onToggleFileSelect: (id: string) => void;
		onOpenNewFolder: (parentId?: string | null) => void;
		onOpenRename: (item: File | Folder, type: 'file' | 'folder') => void;
		onOpenDelete: (item: File | Folder, type: 'file' | 'folder') => void;
		onOpenUpload: () => void;
		onHandleStarFile: (id: string) => void;
		onHandleStarFolder: (id: string) => void;
		onHandleRestoreFile: (id: string) => void;
		onHandleRestoreFolder: (id: string) => void;
		onHandlePermanentDeleteFile: (id: string) => void;
		onHandlePermanentDeleteFolder: (id: string) => void;
		onHandleRestoreWorkspace: (id: string) => void;
		onHandlePermanentDeleteWorkspace: (id: string) => void;
		onFilePointerDown: (event: PointerEvent, fileId: string) => void;
		onFilePointerMove: (event: PointerEvent) => void;
		onFilePointerEnd: () => void;
		onFileDragStart: (event: DragEvent, fileId: string) => void;
		onFolderPointerDown: (event: PointerEvent, folderId: string) => void;
		onFolderPointerMove: (event: PointerEvent) => void;
		onFolderPointerEnd: () => void;
		onFolderItemDragStart: (event: DragEvent, folderId: string) => void;
		onFolderDragOver: (event: DragEvent, key?: string) => void;
		onFolderDragLeave?: (key?: string) => void;
		onFolderDrop: (event: DragEvent, folderId: string | null) => void;
		onCopyFile: (fileId: string) => void;
		onCopyFolder: (folderId: string) => void;
		onPaste: (targetFolderId: string | null) => void;
	}

	let {
		isTrashView,
		isLoading,
		currentFolder,
		currentView,
		folders,
		files,
		tagHeading,
		tagMap,
		selectedFileIds,
		deletedWorkspaces,
		trashRetentionDays,
		formatFileSize,
		formatDate,
		formatTrashExpiry,
		getFileIconComponent,
		getTagClass,
		activeDropTargetKey,
		onNavigateToFolder,
		onToggleFileSelect,
		onOpenNewFolder,
		onOpenRename,
		onOpenDelete,
		onOpenUpload,
		onHandleStarFile,
		onHandleStarFolder,
		onHandleRestoreFile,
		onHandleRestoreFolder,
		onHandlePermanentDeleteFile,
		onHandlePermanentDeleteFolder,
		onHandleRestoreWorkspace,
		onHandlePermanentDeleteWorkspace,
		dragArmingId,
		folderDragArmingId,
		onFilePointerDown,
		onFilePointerMove,
		onFilePointerEnd,
		onFileDragStart,
		onFolderPointerDown,
		onFolderPointerMove,
		onFolderPointerEnd,
		onFolderItemDragStart,
		onFolderDragOver,
		onFolderDragLeave,
		onFolderDrop,
		clipboard,
		onCopyFile,
		onCopyFolder,
		onPaste
	}: Props = $props();

	const fileMenu = (file: File) =>
		buildFileMenu({
			isTrash: isTrashView,
			clipboard,
			isSelected: selectedFileIds.has(file.id),
			isStarred: file.starred,
			inRoot: !file.folderId,
			onToggleSelect: () => onToggleFileSelect(file.id),
			onRename: () => onOpenRename(file, 'file'),
			onStar: () => onHandleStarFile(file.id),
			onRestore: () => onHandleRestoreFile(file.id),
			onDelete: () => onOpenDelete(file, 'file'),
			onPermanentDelete: () => onHandlePermanentDeleteFile(file.id),
			onCopy: () => onCopyFile(file.id),
			onPaste: (targetFolderId) => onPaste(targetFolderId),
			targetFolderId: file.folderId ?? null,
			pasteLabelMode: 'generic'
		});

	const folderMenu = (folder: Folder) =>
		buildFolderMenu({
			isTrash: isTrashView,
			clipboard,
			inRoot: false,
			isStarred: folder.starred,
			onNewFolder: !isTrashView ? () => onOpenNewFolder(folder.id) : undefined,
			onRename: () => onOpenRename(folder, 'folder'),
			onStar: () => onHandleStarFolder(folder.id),
			onRestore: () => onHandleRestoreFolder(folder.id),
			onDelete: () => onOpenDelete(folder, 'folder'),
			onPermanentDelete: () => onHandlePermanentDeleteFolder(folder.id),
			onCopy: () => onCopyFolder(folder.id),
			onPaste: (targetFolderId) => onPaste(targetFolderId),
			targetFolderId: folder.id,
			pasteLabelMode: 'folder'
		});

	const backgroundMenu = () =>
		buildBackgroundMenu({
			clipboard,
			inRoot: !currentFolder,
			onNewFolder: () => onOpenNewFolder(currentFolder?.id ?? null),
			onUpload: onOpenUpload,
			onPaste: (targetFolderId) => onPaste(targetFolderId),
			targetFolderId: currentFolder?.id ?? null,
			pasteLabelMode: 'generic'
		});
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div class="flex min-h-[calc(100vh-4rem)] flex-1 flex-col space-y-4 overflow-auto p-4 md:p-8">
			{#if isTrashView}
				<div
					class="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-muted-foreground"
				>
					<Trash class="mt-0.5 h-4 w-4 text-destructive" />
					<div class="space-y-1">
						<p class="font-medium text-foreground">Trash</p>
						<p>Items here are permanently deleted after {trashRetentionDays} days.</p>
					</div>
				</div>
			{/if}
			{#if isLoading}
				<div class="flex min-h-96 items-center justify-center">
					<Spinner />
				</div>
			{:else if !currentFolder && (folders.length > 0 || files.length > 0 || (isTrashView && deletedWorkspaces.length > 0))}
				{#if isTrashView && deletedWorkspaces.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">WORKSPACES</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each deletedWorkspaces as workspace (workspace.id)}
								<Card class="flex h-full flex-col justify-between p-4">
									<div class="space-y-1">
										<p class="text-sm font-semibold text-foreground">{workspace.name}</p>
										{#if workspace.description}
											<p class="text-sm text-muted-foreground">{workspace.description}</p>
										{/if}
										{#if workspace.deletedAt}
											<p class="text-xs text-muted-foreground">
												Deleted {formatDate(workspace.deletedAt)}
											</p>
										{/if}
									</div>
									<div class="mt-4 flex flex-wrap gap-2">
										<Button
											size="sm"
											variant="secondary"
											onclick={() => onHandleRestoreWorkspace(workspace.id)}>Restore</Button
										>
										<Button
											size="sm"
											variant="destructive"
											onclick={() => onHandlePermanentDeleteWorkspace(workspace.id)}
										>
											Delete permanently
										</Button>
									</div>
								</Card>
							{/each}
						</div>
					</div>
				{/if}
				{#if currentView !== 'tags' && folders.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each folders as folder (folder.id)}
								{@const dropKey = `folder-${folder.id}`}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div
											class="group h-full"
											role="button"
											tabindex="0"
											ondragenter={(event) => onFolderDragOver(event, dropKey)}
											ondragover={(event) => onFolderDragOver(event, dropKey)}
											ondragleave={() => onFolderDragLeave?.(dropKey)}
											ondrop={(event) => {
												onFolderDrop(event, folder.id);
												onFolderDragLeave?.(dropKey);
											}}
										>
											<Card
												class={`relative h-full cursor-pointer border transition-all hover:shadow-lg ${
													activeDropTargetKey === dropKey ? 'border-accent' : 'border-border'
												} ${folderDragArmingId === folder.id ? 'animate-pulse' : ''}`}
												onclick={() => onNavigateToFolder(folder)}
												draggable={!isTrashView}
												onpointerdown={!isTrashView
													? (event) => onFolderPointerDown(event, folder.id)
													: undefined}
												onpointermove={!isTrashView ? onFolderPointerMove : undefined}
												onpointerup={!isTrashView ? onFolderPointerEnd : undefined}
												onpointerleave={!isTrashView ? onFolderPointerEnd : undefined}
												onpointercancel={!isTrashView ? onFolderPointerEnd : undefined}
												ondragstart={!isTrashView
													? (event) => onFolderItemDragStart(event, folder.id)
													: undefined}
											>
												{#if folder.starred}
													<Star
														class="absolute top-2 right-2 h-4 w-4 text-accent"
														fill="currentColor"
													/>
												{/if}
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
													{#if isTrashView}
														{@const expiry = formatTrashExpiry(folder)}
														{#if expiry}
															<p
																class="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"
															>
																<RotateCcw class="h-3 w-3" />
																Auto-deletes {expiry}
															</p>
														{/if}
													{/if}
												</CardContent>
											</Card>
										</div>
									</ContextMenu.Trigger>
									<MenuContent items={folderMenu(folder)} />
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
						{currentView === 'tags' ? tagHeading : 'FILES'}
					</h3>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each files as file (file.id)}
							{@const Icon = getFileIconComponent(file.mimeType)}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<div class="group h-full" class:animate-pulse={dragArmingId === file.id}>
										<Card
											class="relative h-full transition-shadow hover:shadow-lg"
											draggable="true"
											onpointerdown={(event) => onFilePointerDown(event, file.id)}
											onpointermove={onFilePointerMove}
											onpointerup={onFilePointerEnd}
											onpointerleave={onFilePointerEnd}
											onpointercancel={onFilePointerEnd}
											ondragstart={(event) => onFileDragStart(event, file.id)}
										>
											{#if file.starred}
												<Star
													class="absolute top-2 right-2 h-4 w-4 text-accent"
													fill="currentColor"
												/>
											{/if}
											<div
												class="absolute top-2 left-2 z-10 transition-opacity"
												class:opacity-100={selectedFileIds.has(file.id)}
												class:opacity-0={!selectedFileIds.has(file.id)}
												class:group-hover:opacity-100={!selectedFileIds.has(file.id)}
											>
												<Checkbox
													checked={selectedFileIds.has(file.id)}
													onCheckedChange={() => onToggleFileSelect(file.id)}
												/>
											</div>
											<CardContent class="h-full p-4">
												<div class="mb-2 flex justify-center">
													<Icon class="h-12 w-12 text-muted-foreground" />
												</div>

												<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">
													{file.name}
												</h3>

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

												{#if file.tagIds && file.tagIds.length > 0}
													<div class="mt-2 flex flex-wrap justify-center gap-1">
														{#each file.tagIds as tagId}
															{@const tag = tagMap.get(tagId)}
															<Badge class={getTagClass(tagId)}>{tag?.name ?? 'Tag'}</Badge>
														{/each}
													</div>
												{/if}
												{#if isTrashView}
													{@const expiry = formatTrashExpiry(file)}
													{#if expiry}
														<p
															class="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"
														>
															<RotateCcw class="h-3 w-3" />
															Auto-deletes {expiry}
														</p>
													{/if}
												{/if}
											</CardContent>
										</Card>
									</div>
								</ContextMenu.Trigger>
								<MenuContent items={fileMenu(file)} />
							</ContextMenu.Root>
						{/each}
					</div>
				{/if}
			{:else if currentFolder && (folders.length > 0 || files.length > 0)}
				{#if folders.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each folders as folder (folder.id)}
								{@const dropKey = `folder-${folder.id}`}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div
											class="group h-full"
											role="button"
											tabindex="0"
											ondragenter={(event) => onFolderDragOver(event, dropKey)}
											ondragover={(event) => onFolderDragOver(event, dropKey)}
											ondragleave={() => onFolderDragLeave?.(dropKey)}
											ondrop={(event) => {
												onFolderDrop(event, folder.id);
												onFolderDragLeave?.(dropKey);
											}}
										>
											<Card
												class={`relative h-full cursor-pointer border border-border transition-all hover:shadow-lg ${
													activeDropTargetKey === dropKey
														? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
														: ''
												} ${folderDragArmingId === folder.id ? 'animate-pulse' : ''}`}
												onclick={() => onNavigateToFolder(folder)}
												draggable={!isTrashView}
												onpointerdown={!isTrashView
													? (event) => onFolderPointerDown(event, folder.id)
													: undefined}
												onpointermove={!isTrashView ? onFolderPointerMove : undefined}
												onpointerup={!isTrashView ? onFolderPointerEnd : undefined}
												onpointerleave={!isTrashView ? onFolderPointerEnd : undefined}
												onpointercancel={!isTrashView ? onFolderPointerEnd : undefined}
												ondragstart={!isTrashView
													? (event) => onFolderItemDragStart(event, folder.id)
													: undefined}
											>
												{#if folder.starred}
													<Star
														class="absolute top-2 right-2 h-4 w-4 text-accent"
														fill="currentColor"
													/>
												{/if}
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
													{#if isTrashView}
														{@const expiry = formatTrashExpiry(folder)}
														{#if expiry}
															<p
																class="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"
															>
																<RotateCcw class="h-3 w-3" />
																Auto-deletes {expiry}
															</p>
														{/if}
													{/if}
												</CardContent>
											</Card>
										</div>
									</ContextMenu.Trigger>
									<MenuContent items={folderMenu(folder)} />
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
						{currentView === 'tags' ? tagHeading : 'FILES'}
					</h3>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each files as file (file.id)}
							{@const Icon = getFileIconComponent(file.mimeType)}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<div class="group h-full" class:animate-pulse={dragArmingId === file.id}>
										<Card
											class="relative h-full transition-shadow hover:shadow-lg"
											draggable="true"
											onpointerdown={(event) => onFilePointerDown(event, file.id)}
											onpointermove={onFilePointerMove}
											onpointerup={onFilePointerEnd}
											onpointerleave={onFilePointerEnd}
											onpointercancel={onFilePointerEnd}
											ondragstart={(event) => onFileDragStart(event, file.id)}
										>
											{#if file.starred}
												<Star
													class="absolute top-2 right-2 h-4 w-4 text-accent"
													fill="currentColor"
												/>
											{/if}
											<div
												class="absolute top-2 left-2 z-10 transition-opacity"
												class:opacity-100={selectedFileIds.has(file.id)}
												class:opacity-0={!selectedFileIds.has(file.id)}
												class:group-hover:opacity-100={!selectedFileIds.has(file.id)}
											>
												<Checkbox
													checked={selectedFileIds.has(file.id)}
													onCheckedChange={() => onToggleFileSelect(file.id)}
												/>
											</div>

											<CardContent class="h-full p-4">
												<div class="mb-2 flex justify-center">
													<Icon class="h-12 w-12 text-muted-foreground" />
												</div>

												<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">
													{file.name}
												</h3>

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

												{#if file.tagIds && file.tagIds.length > 0}
													<div class="mt-2 flex flex-wrap justify-center gap-1">
														{#each file.tagIds as tagId}
															{@const tag = tagMap.get(tagId)}
															<Badge class={getTagClass(tagId)}>{tag?.name ?? 'Tag'}</Badge>
														{/each}
													</div>
												{/if}
												{#if isTrashView}
													{@const expiry = formatTrashExpiry(file)}
													{#if expiry}
														<p
															class="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground"
														>
															<RotateCcw class="h-3 w-3" />
															Auto-deletes {expiry}
														</p>
													{/if}
												{/if}
											</CardContent>
										</Card>
									</div>
								</ContextMenu.Trigger>
								<MenuContent items={fileMenu(file)} />
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
						{currentFolder ? 'This folder is empty' : 'No files yet'}
					</p>
					<p class="text-sm text-muted-foreground">Upload files or create folders to get started</p>
				</div>
			{/if}
		</div>
	</ContextMenu.Trigger>
	<MenuContent items={backgroundMenu()} />
</ContextMenu.Root>
