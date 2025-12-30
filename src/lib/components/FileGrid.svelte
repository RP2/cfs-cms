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
	import {
		currentFiles,
		currentFolder,
		currentWorkspace,
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

	let files: File[] = [];
	let folders: Folder[] = [];

	// Subscribe to current folder and update files/folders
	$: if ($currentFolder) {
		// Inside a folder: show both subfolders AND files
		files = getFilesForFolder($currentFolder.id);
		folders = getSubfolders($currentFolder.id, $currentWorkspace?.id || '');
	} else if ($currentWorkspace) {
		// At workspace root: show only top-level folders
		files = [];
		folders = getSubfolders(null, $currentWorkspace.id);
	} else {
		files = [];
		folders = [];
	}

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
</script>

{#if $viewType === 'grid'}
	<!-- Grid View -->
	<div class="space-y-4 p-6">
		<!-- Show folders at workspace root, files inside folders -->
		{#if !$currentFolder && folders.length > 0}
			<!-- Workspace Root: Display Folders -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each folders as folder (folder.id)}
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
								<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">{folder.name}</h3>

								<!-- Folder Description -->
								{#if folder.description}
									<p class="line-clamp-2 text-center text-xs text-muted-foreground">
										{folder.description}
									</p>
								{/if}
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		{:else if $currentFolder && (folders.length > 0 || files.length > 0)}
			<!-- Inside Folder: Display Both Subfolders and Files -->
			<!-- Subfolders -->
			{#if folders.length > 0}
				<div class="mb-4">
					<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each folders as folder (folder.id)}
							<div class="group h-full">
								<Card
									class="relative h-full cursor-pointer transition-shadow hover:shadow-lg"
									onclick={() => navigateToFolder(folder)}
								>
									<CardContent class="h-full p-4">
										<div class="mb-2 flex justify-center">
											<FolderIcon class="h-12 w-12 text-accent" />
										</div>
										<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">{folder.name}</h3>
										{#if folder.description}
											<p class="line-clamp-2 text-center text-xs text-muted-foreground">
												{folder.description}
											</p>
										{/if}
									</CardContent>
								</Card>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Files -->
			{#if files.length > 0}
				{#if folders.length > 0}
					<h3 class="mt-6 mb-3 text-sm font-medium text-muted-foreground">FILES</h3>
				{/if}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each files as file (file.id)}
						<div class="group h-full">
							<Card class="relative h-full cursor-pointer transition-shadow hover:shadow-lg">
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
										<svelte:component
											this={getFileIconComponent(file.mimeType)}
											class="h-12 w-12 text-muted-foreground"
										/>
									</div>

									<!-- File Name -->
									<h3 class="mb-2 line-clamp-2 text-center text-sm font-medium">{file.name}</h3>

									<!-- File Info -->
									<div class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
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
				<p class="text-sm text-muted-foreground">Upload files or create folders to get started</p>
			</div>
		{/if}
	</div>
{:else}
	<!-- List View -->
	<div class="p-6">
		{#if !$currentFolder && folders.length > 0}
			<!-- Workspace Root: Display Folders -->
			<div class="space-y-2">
				{#each folders as folder (folder.id)}
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
				{/each}
			</div>
		{:else if $currentFolder && (folders.length > 0 || files.length > 0)}
			<!-- Inside Folder: Display Both Subfolders and Files -->
			{#if folders.length > 0}
				<div class="mb-6">
					<h3 class="mb-3 text-sm font-medium text-muted-foreground">FOLDERS</h3>
					<div class="space-y-2">
						{#each folders as folder (folder.id)}
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
						{/each}
					</div>
				</div>
			{/if}

			{#if files.length > 0}
				{#if folders.length > 0}
					<h3 class="mb-3 text-sm font-medium text-muted-foreground">FILES</h3>
				{/if}
				<div class="space-y-2">
					{#each files as file (file.id)}
						<div class="flex items-center gap-3 rounded border p-3 hover:bg-muted">
							<Checkbox
								checked={$selectedFileIds.has(file.id)}
								onCheckedChange={() => toggleFileSelect(file.id)}
							/>
							<svelte:component
								this={getFileIconComponent(file.mimeType)}
								class="h-6 w-6 text-muted-foreground"
							/>
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
					{/each}
				</div>
			{/if}
		{:else}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">No files found</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Ensure CardFooter exists */
	:global(.card-footer) {
		display: flex;
		flex-direction: column;
	}
</style>
