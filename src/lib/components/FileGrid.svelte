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
	import { currentFiles, currentFolder, selectedFileIds, viewType } from '$lib/stores';
	import { mockFiles, getFilesForFolder } from '$lib/data/mock';
	import type { File } from '$lib/types';
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
		FolderOpen
	} from '@lucide/svelte';

	let files: File[] = [];

	// Subscribe to current folder and update files
	$: if ($currentFolder) {
		files = getFilesForFolder($currentFolder.id);
	} else {
		files = mockFiles.filter((f) => !f.deletedAt);
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
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold">
					{$currentFolder ? $currentFolder.name : 'All Files'}
				</h2>
				{#if $currentFolder?.description}
					<p class="text-sm text-muted-foreground">{$currentFolder.description}</p>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button class="gap-2">
					<Plus class="h-4 w-4" />
					New Folder
				</Button>
				<Button class="gap-2">
					<Upload class="h-4 w-4" />
					Upload
				</Button>
			</div>
		</div>

		<!-- Files Grid -->
		{#if files.length > 0}
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
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold">
				{$currentFolder ? $currentFolder.name : 'All Files'}
			</h2>
			<div class="flex gap-2">
				<Button class="gap-2">
					<Plus class="h-4 w-4" />
					New Folder
				</Button>
				<Button class="gap-2">
					<Upload class="h-4 w-4" />
					Upload
				</Button>
			</div>
		</div>

		{#if files.length > 0}
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
