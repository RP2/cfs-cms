<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';
	import {
		MoreVertical,
		Download,
		Copy,
		Star,
		Trash2,
		RotateCcw,
		Edit,
		Tag,
		Clock,
		FileUp,
		AlertCircle
	} from '@lucide/svelte';
	import type { File, Folder, Tag as TagType } from '$lib/types';
	import {
		buildFileMetadata,
		getExpiryCountdown,
		getFileIcon,
		extractMetadataDetails,
		type FileMetadata
	} from '$lib/utils/fileMetadata';
	import { formatFileSize, formatDateShort, downloadFile } from '$lib/utils/formatters';
	import PreviewImage from '$lib/components/previews/PreviewImage.svelte';
	import PreviewMedia from '$lib/components/previews/PreviewMedia.svelte';
	import PreviewText from '$lib/components/previews/PreviewText.svelte';
	import PreviewGeneric from '$lib/components/previews/PreviewGeneric.svelte';
	import {
		toggleFileStar,
		restoreFile,
		permanentlyDeleteFile,
		deleteFiles
	} from '$lib/services/dataService';
	import { workspaceFolders, workspaceTags, currentFiles } from '$lib/stores';
	import { getFileExtension } from '$lib/utils/fileMetadata';

	interface Props {
		file: File | null;
		open?: boolean;
		currentFolder?: Folder | null;
		onOpenChange?: (open: boolean) => void;
	}

	let {
		file = $bindable(null),
		open = $bindable(false),
		currentFolder,
		onOpenChange = () => {}
	}: Props = $props();

	let showDeleteConfirm = $state(false);

	// Derived state
	let metadata = $derived(file ? buildFileMetadata(file) : null);
	let metadataDetails = $derived(
		file && metadata ? extractMetadataDetails(file, metadata.category) : {}
	);
	let extension = $derived(file ? getFileExtension(file.name) : '');
	// Get live starred state from store to ensure reactivity
	let isStarred = $derived.by(() => {
		if (!file) return false;
		const liveFile = $currentFiles.find((f) => f.id === file.id);
		return liveFile?.starred ?? false;
	});
	let fileTags = $derived.by(() => {
		if (!file?.tagIds || !$workspaceTags) return [];
		return $workspaceTags.filter((t) => file.tagIds?.includes(t.id));
	});
	let folderPath = $derived.by(() => {
		if (!file) return '';
		let path = [];
		let currentId = file.folderId;

		while (currentId) {
			const folder = $workspaceFolders.find((f) => f.id === currentId);
			if (!folder) break;
			path.unshift(folder.name);
			currentId = folder.parentId;
		}

		return path.length > 0 ? path.join(' / ') : 'Root';
	});

	// Actions
	function handleStar() {
		if (!file) return;
		toggleFileStar(file.id);
	}

	function handleRestore() {
		if (!file) return;
		restoreFile(file.id);
		open = false;
	}

	function handlePermanentDelete() {
		if (!file) return;
		permanentlyDeleteFile(file.id);
		open = false;
	}

	function handleDelete() {
		showDeleteConfirm = true;
	}

	function confirmDelete() {
		if (!file) return;
		deleteFiles([file.id]);
		open = false;
		showDeleteConfirm = false;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
	}

	function handleDownload() {
		if (!file) return;
		downloadFile(file);
	}

	// Watchers
	$effect(() => {
		onOpenChange(open);
	});
</script>

{#if file && metadata}
	<Dialog bind:open>
		<DialogContent class="max-h-[95dvh] overflow-hidden p-4">
			<!-- Header Section -->
			<DialogHeader class="border-b py-4">
				<div class="flex items-start gap-3">
					<div class="min-w-0 flex-1">
						<div class="flex justify-center gap-2 sm:justify-start">
							<DialogTitle class="text-lg font-semibold">{file.name}</DialogTitle>
							<button
								onclick={handleStar}
								class="mt-0.5 transition-opacity hover:opacity-70"
								title={isStarred ? 'Remove star' : 'Add star'}
							>
								<Star
									class={`h-5 w-5 ${isStarred ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
								/>
							</button>
						</div>
						<p class="mt-1 text-xs text-muted-foreground">{folderPath}</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{extension.toUpperCase()} • {formatFileSize(file.size)}
						</p>
					</div>
				</div>
			</DialogHeader>

			<ScrollArea class="-mx-4 max-h-[calc(95dvh-8rem)]">
				<div class="px-4">
					<!-- Trash Warning -->
					{#if metadata.isTrashed}
						<div class="border-b bg-destructive/10 py-3">
							<div class="flex items-start gap-2">
								<AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
								<div class="space-y-1 text-xs">
									<p class="font-medium text-destructive">In Trash</p>
									{#if file.trashedUntil}
										<p class="text-destructive/80">{getExpiryCountdown(file.trashedUntil)}</p>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Preview Section -->
					{#if metadata.isPreviewable}
						<div class="bg-muted/10 md:px-2">
							{#if metadata.previewType === 'image'}
								<PreviewImage {file} />
							{:else if metadata.previewType === 'media'}
								<PreviewMedia {file} />
							{:else if metadata.previewType === 'text'}
								<PreviewText {file} />
							{:else}
								<PreviewGeneric {file} />
							{/if}
						</div>
					{/if}

					<!-- Details Section -->
					<div class="space-y-4 pt-4 md:px-6">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="mb-1 text-xs font-medium text-muted-foreground">Uploaded</p>
								<p class="text-sm text-foreground">{formatDateShort(file.createdAt)}</p>
							</div>
							<div>
								<p class="mb-1 text-xs font-medium text-muted-foreground">Last modified</p>
								<p class="text-sm text-foreground">{formatDateShort(file.updatedAt)}</p>
							</div>
						</div>
						<!-- Tags -->
						{#if fileTags.length > 0}
							<div class="min-w-0">
								<p class="mb-1.5 text-xs font-medium text-muted-foreground">Tags</p>
								<div class="flex flex-wrap gap-1">
									{#each fileTags as tag (tag.id)}
										<Badge variant="secondary" class="min-w-0 text-xs">{tag.name}</Badge>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Metadata Details (Phase 2+) -->
						{#if Object.keys(metadataDetails).length > 0}
							<Separator />
							<div class="grid grid-cols-2 gap-4">
								{#each Object.entries(metadataDetails) as [key, value] (key)}
									<div>
										<p class="mb-1 text-xs font-medium text-muted-foreground capitalize">{key}</p>
										<p class="text-sm text-foreground">{value}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Action Buttons -->
					<div class="space-y-2 py-4 md:px-6">
						{#if !metadata.isTrashed}
							<Button variant="secondary" size="sm" onclick={handleDownload} class="w-full gap-2">
								<Download class="h-4 w-4" />
								Download
							</Button>
							<Button variant="destructive" size="sm" onclick={handleDelete} class="w-full gap-2">
								<Trash2 class="h-4 w-4" />
								Move to Trash
							</Button>
						{:else}
							<div class="grid grid-cols-2 gap-2">
								<Button variant="secondary" size="sm" onclick={handleRestore} class="gap-2">
									<RotateCcw class="h-4 w-4" />
									Restore
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onclick={handlePermanentDelete}
									class="gap-2"
								>
									<Trash2 class="h-4 w-4" />
									Delete Permanently
								</Button>
							</div>
						{/if}
					</div>
				</div>
			</ScrollArea>
		</DialogContent>
	</Dialog>

	<Dialog bind:open={showDeleteConfirm}>
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>Move to Trash?</DialogTitle>
				<DialogDescription>
					This will move <span class="font-medium">{file?.name}</span> to trash. You can recover it within
					30 days.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onclick={cancelDelete}>Cancel</Button>
				<Button variant="destructive" onclick={confirmDelete}>Move to Trash</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
