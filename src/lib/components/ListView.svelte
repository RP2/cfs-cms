<script lang="ts">
	// Note: use native on* attributes (ondragover/ondrop/ondragstart) instead of on: syntax here to avoid Svelte 5 warnings.
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Skeleton } from '$lib/components/ui/skeleton';
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
		Folder as FolderIcon,
		MoreVertical
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
		onOpenFileDetail: (file: File) => void;
		onDownloadFile: (fileId: string) => void;
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
		onFilePointerEnd: (fileId: string) => void;
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
		onOpenFileDetail,
		onDownloadFile,
		onHandleStarFile,
		onHandleStarFolder,
		onHandleRestoreFile,
		onHandleRestoreFolder,
		onHandlePermanentDeleteFile,
		onHandlePermanentDeleteFolder,
		onHandleRestoreWorkspace,
		onHandlePermanentDeleteWorkspace,
		clipboard,
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
			onDownload: () => onDownloadFile(file.id),
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
		<div class="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-auto p-4 md:p-8">
			{#if isTrashView}
				<div
					class="mb-4 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-muted-foreground"
				>
					<Trash class="mt-0.5 h-4 w-4 text-destructive" />
					<div class="space-y-1">
						<p class="font-medium text-foreground">Trash</p>
						<p>Items here are permanently deleted after {trashRetentionDays} days.</p>
					</div>
				</div>
			{/if}
			{#if isLoading}
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
			{:else if !currentFolder && (folders.length > 0 || files.length > 0 || (isTrashView && deletedWorkspaces.length > 0))}
				{#if isTrashView && deletedWorkspaces.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">WORKSPACES</h3>
						<div class="space-y-2">
							{#each deletedWorkspaces as workspace (workspace.id)}
								<div class="flex items-center justify-between rounded border p-3">
									<div>
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
									<div class="flex flex-wrap gap-2">
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
								</div>
							{/each}
						</div>
					</div>
				{/if}
				{#if currentView !== 'tags' && folders.length > 0}
					<div>
						<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
						<div class="space-y-2">
							{#each folders as folder (folder.id)}
								{@const dropKey = `folder-${folder.id}`}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div
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
											<button
												type="button"
												class={`relative flex w-full cursor-pointer items-center gap-3 rounded border p-3 text-left transition-all hover:bg-muted ${
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
												<FolderIcon class="h-6 w-6 text-accent" />
												<div class="flex-1">
													<p class="font-medium">{folder.name}</p>
													{#if folder.description}
														<p class="text-sm text-muted-foreground">{folder.description}</p>
													{/if}
													{#if isTrashView}
														{@const expiry = formatTrashExpiry(folder)}
														{#if expiry}
															<p class="flex items-center gap-1 text-xs text-destructive">
																<RotateCcw class="h-3 w-3" />{expiry}
															</p>
														{/if}
													{/if}
												</div>
												{#if folder.starred}
													<div class="ml-auto flex items-center pr-1">
														<Star class="h-4 w-4 text-accent" fill="currentColor" />
													</div>
												{/if}
											</button>
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
						class:mt-6={currentView !== 'tags' && folders.length > 0}
					>
						{currentView === 'tags' ? tagHeading : 'FILES'}
					</h3>
					<div class="space-y-2">
						{#each files as file (file.id)}
							{@const Icon = getFileIconComponent(file.mimeType)}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<div
										class="relative flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-muted"
										draggable="true"
										role="button"
										tabindex="0"
										class:animate-pulse={dragArmingId === file.id}
										onclick={() => onOpenFileDetail(file)}
										onkeydown={(e) => e.key === 'Enter' && onOpenFileDetail(file)}
										onpointerdown={(event) => onFilePointerDown(event, file.id)}
										onpointermove={onFilePointerMove}
										onpointerup={() => onFilePointerEnd(file.id)}
										onpointerleave={() => onFilePointerEnd(file.id)}
										onpointercancel={() => onFilePointerEnd(file.id)}
										ondragstart={(event) => onFileDragStart(event, file.id)}
									>
										<Checkbox
											checked={selectedFileIds.has(file.id)}
											onCheckedChange={() => onToggleFileSelect(file.id)}
										/>
										<Icon class="h-6 w-6 text-muted-foreground" />
										<div class="flex-1">
											<p class="font-medium">{file.name}</p>
											<p class="text-sm text-muted-foreground">
												{formatFileSize(file.size)} • {formatDate(file.createdAt)}
											</p>
											{#if isTrashView}
												{@const expiry = formatTrashExpiry(file)}
												{#if expiry}
													<p class="flex items-center gap-1 text-xs text-destructive">
														<RotateCcw class="h-3 w-3" />{expiry}
													</p>
												{/if}
											{/if}
										</div>
										{#if file.starred}
											<div class="ml-auto flex items-center pr-1">
												<Star class="h-4 w-4 text-accent" fill="currentColor" />
											</div>
										{/if}
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
						<div class="space-y-2">
							{#each folders as folder (folder.id)}
								{@const dropKey = `folder-${folder.id}`}
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<div
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
											<button
												type="button"
												class={`relative flex w-full cursor-pointer items-center gap-3 rounded border border-border p-3 text-left transition-all hover:bg-muted ${
													activeDropTargetKey === dropKey
														? 'ring-2 ring-accent ring-offset-1 ring-offset-background'
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
												<FolderIcon class="h-6 w-6 text-accent" />
												<div class="flex-1">
													<p class="font-medium">{folder.name}</p>
													{#if folder.description}
														<p class="text-sm text-muted-foreground">{folder.description}</p>
													{/if}
													{#if isTrashView}
														{@const expiry = formatTrashExpiry(folder)}
														{#if expiry}
															<p class="text-xs text-muted-foreground">Auto-deletes {expiry}</p>
														{/if}
													{/if}
												</div>
												{#if folder.starred}
													<div class="ml-auto flex items-center pr-1">
														<Star class="h-4 w-4 text-accent" fill="currentColor" />
													</div>
												{/if}
											</button>
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
					<div class="space-y-2">
						{#each files as file (file.id)}
							{@const Icon = getFileIconComponent(file.mimeType)}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<div
										class="relative flex items-center gap-3 rounded border p-3 hover:bg-muted"
										draggable="true"
										role="button"
										tabindex="0"
										onpointerdown={(event) => onFilePointerDown(event, file.id)}
										onpointermove={onFilePointerMove}
										onpointerup={() => onFilePointerEnd(file.id)}
										onpointerleave={() => onFilePointerEnd(file.id)}
										onpointercancel={() => onFilePointerEnd(file.id)}
										ondragstart={(event) => onFileDragStart(event, file.id)}
									>
										<Checkbox
											checked={selectedFileIds.has(file.id)}
											onCheckedChange={() => onToggleFileSelect(file.id)}
										/>
										<Icon class="h-6 w-6 text-muted-foreground" />
										<div class="flex-1">
											<p class="font-medium">{file.name}</p>
											<p class="text-sm text-muted-foreground">
												{formatFileSize(file.size)} • {formatDate(file.createdAt)}
											</p>
											{#if isTrashView}
												{@const expiry = formatTrashExpiry(file)}
												{#if expiry}
													<p class="text-xs text-muted-foreground">Auto-deletes {expiry}</p>
												{/if}
											{/if}
										</div>
										{#if file.starred}
											<div class="ml-auto flex items-center pr-1">
												<Star class="h-4 w-4 text-accent" fill="currentColor" />
											</div>
										{/if}
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
