<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { currentFiles, currentFolder, selectedFileIds, viewType } from '$lib/stores';
	import { mockFiles, getFilesForFolder } from '$lib/data/mock';
	import type { File } from '$lib/types';

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

	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('video/')) return '🎬';
		if (mimeType.includes('photoshop')) return '🎨';
		if (mimeType.includes('pdf')) return '📄';
		return '📎';
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
				<button
					class="rounded bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
				>
					➕ New Folder
				</button>
				<button
					class="rounded bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
				>
					📤 Upload
				</button>
			</div>
		</div>

		<!-- Files Grid -->
		{#if files.length > 0}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each files as file (file.id)}
					<div class="group h-full">
						<Card
							class="relative flex h-full cursor-pointer flex-col transition-shadow hover:shadow-lg"
						>
							<!-- Checkbox on hover -->
							<input
								type="checkbox"
								class="absolute top-2 left-2 z-10 h-4 w-4 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
								checked={$selectedFileIds.has(file.id)}
								on:change={() => toggleFileSelect(file.id)}
							/>

							<CardContent class="shrink-0 p-4 pb-2 text-center">
								<!-- File Icon/Preview -->
								<div class="mb-3 text-6xl">
									{getFileIcon(file.mimeType)}
								</div>

								<!-- File Name -->
								<h3 class="line-clamp-2 truncate text-sm font-semibold">{file.name}</h3>
							</CardContent>

							<div class="flex grow flex-col gap-2 border-t p-4 pt-2">
								<!-- File Size & Date -->
								<div class="space-y-1 text-xs text-muted-foreground">
									<div>📦 {formatFileSize(file.size)}</div>
									<div>📅 {formatDate(file.createdAt)}</div>
								</div>

								<!-- Tags -->
								{#if file.tagIds && file.tagIds.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each file.tagIds as tagId}
											<span class="rounded bg-accent px-2 py-1 text-xs text-primary"> Tag </span>
										{/each}
									</div>
								{/if}

								<!-- Quick Actions -->
								<div
									class="flex gap-1 text-sm opacity-0 transition-opacity group-hover:opacity-100"
								>
									<Button variant="outline" size="sm" class="flex-1">✎</Button>
									<Button variant="outline" size="sm" class="flex-1">⋮</Button>
								</div>
							</div>
						</Card>
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-12 text-center">
				<div class="mb-4 text-4xl">📂</div>
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
				<button
					class="rounded bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
				>
					➕ New Folder
				</button>
				<button
					class="rounded bg-accent px-4 py-2 font-medium text-accent-foreground hover:opacity-90"
				>
					📤 Upload
				</button>
			</div>
		</div>

		{#if files.length > 0}
			<div class="space-y-2">
				{#each files as file (file.id)}
					<div class="flex items-center gap-3 rounded border p-3 hover:bg-muted">
						<input
							type="checkbox"
							class="h-4 w-4"
							checked={$selectedFileIds.has(file.id)}
							on:change={() => toggleFileSelect(file.id)}
						/>
						<span class="text-2xl">{getFileIcon(file.mimeType)}</span>
						<div class="flex-1">
							<p class="font-medium">{file.name}</p>
							<p class="text-sm text-muted-foreground">
								{formatFileSize(file.size)} • {formatDate(file.createdAt)}
							</p>
						</div>
						<button class="rounded px-2 py-1 hover:bg-muted">⋮</button>
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
