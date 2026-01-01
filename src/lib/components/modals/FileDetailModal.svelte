<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
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
	import { workspaceFolders, workspaceTags } from '$lib/stores';
	import { getFileExtension } from '$lib/utils/fileMetadata';

	interface Props {
		file: File | null;
		open?: boolean;
		currentFolder?: Folder | null;
		onOpenChange?: (open: boolean) => void;
		onRename?: (file: File) => void;
		onMove?: (file: File) => void;
		onTag?: (file: File) => void;
	}

	let {
		file = $bindable(null),
		open = $bindable(false),
		currentFolder,
		onOpenChange = () => {},
		onRename = () => {},
		onMove = () => {},
		onTag = () => {}
	}: Props = $props();

	// Derived state
	let metadata = $derived(file ? buildFileMetadata(file) : null);
	let metadataDetails = $derived(
		file && metadata ? extractMetadataDetails(file, metadata.category) : {}
	);
	let extension = $derived(file ? getFileExtension(file.name) : '');
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
		if (!file) return;
		deleteFiles([file.id]);
		open = false;
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
		<DialogContent class="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
			<DialogHeader class="border-b px-6 py-4">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<DialogTitle class="text-lg font-semibold">{file.name}</DialogTitle>
						<p class="mt-1 text-xs text-muted-foreground">
							{extension.toUpperCase()} • {formatFileSize(file.size)}
						</p>
					</div>
					<div class="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onclick={handleStar}
							class="h-8 w-8"
							title={file.starred ? 'Remove star' : 'Add star'}
						>
							<Star class={`h-4 w-4 ${file.starred ? 'fill-accent text-accent' : ''}`} />
						</Button>
					</div>
				</div>
			</DialogHeader>

			<!-- Main Content Area -->
			<div class="flex flex-1 overflow-hidden">
				<!-- Preview Section -->
				{#if metadata.isPreviewable}
					<div class="flex-1 overflow-auto border-r bg-muted/10 p-4">
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

				<!-- Details Panel -->
				<div class="flex w-80 flex-col overflow-auto">
					<!-- Trash Warning -->
					{#if metadata.isTrashed}
						<div class="border-b bg-destructive/10 px-4 py-3">
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

					<!-- Metadata -->
					<div class="flex-1 space-y-4 overflow-auto px-4 py-4">
						<!-- Location -->
						<div>
							<p class="mb-1.5 text-xs font-medium text-muted-foreground">Location</p>
							<p class="text-sm text-foreground">{folderPath}</p>
						</div>

						{#if metadata.category !== 'unknown'}
							<div>
								<p class="mb-1.5 text-xs font-medium text-muted-foreground">Type</p>
								<p class="text-sm text-foreground capitalize">{metadata.category}</p>
							</div>
						{/if}

						<!-- Timestamps -->
						<div class="space-y-2">
							<div>
								<p class="mb-1 text-xs font-medium text-muted-foreground">Created</p>
								<p class="text-sm text-foreground">{formatDateShort(file.createdAt)}</p>
							</div>
							<div>
								<p class="mb-1 text-xs font-medium text-muted-foreground">Modified</p>
								<p class="text-sm text-foreground">{formatDateShort(file.updatedAt)}</p>
							</div>
						</div>

						<!-- Tags -->
						{#if fileTags.length > 0}
							<div>
								<p class="mb-1.5 text-xs font-medium text-muted-foreground">Tags</p>
								<div class="flex flex-wrap gap-1">
									{#each fileTags as tag (tag.id)}
										<Badge variant="secondary" class="text-xs">{tag.name}</Badge>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Metadata Details (Phase 2+) -->
						{#if Object.keys(metadataDetails).length > 0}
							<Separator class="my-2" />
							<div class="space-y-2">
								{#each Object.entries(metadataDetails) as [key, value] (key)}
									<div>
										<p class="mb-0.5 text-xs font-medium text-muted-foreground capitalize">{key}</p>
										<p class="text-sm text-foreground">{value}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Action Buttons -->
					<div class="space-y-2 border-t px-4 py-3">
						{#if !metadata.isTrashed}
							<div class="grid grid-cols-2 gap-2">
								<Button
									variant="secondary"
									size="sm"
									onclick={() => onRename(file)}
									class="h-8 gap-2"
								>
									<Edit class="h-3.5 w-3.5" />
									Rename
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onclick={() => onMove(file)}
									class="h-8 gap-2"
								>
									<FileUp class="h-3.5 w-3.5" />
									Move
								</Button>
								<Button variant="secondary" size="sm" onclick={() => onTag(file)} class="h-8 gap-2">
									<Tag class="h-3.5 w-3.5" />
									Tag
								</Button>
							</div>
							<Button
								variant="secondary"
								size="sm"
								onclick={handleDownload}
								class="h-8 w-full gap-2"
							>
								<Download class="h-3.5 w-3.5" />
								Download
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onclick={handleDelete}
								class="h-8 w-full gap-2"
							>
								<Trash2 class="h-3.5 w-3.5" />
								Delete
							</Button>
						{:else}
							<!-- Trash Actions -->
							<Button
								variant="secondary"
								size="sm"
								onclick={handleRestore}
								class="h-8 w-full gap-2"
							>
								<RotateCcw class="h-3.5 w-3.5" />
								Restore
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onclick={handlePermanentDelete}
								class="h-8 w-full gap-2"
							>
								<Trash2 class="h-3.5 w-3.5" />
								Delete Permanently
							</Button>
						{/if}
					</div>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
