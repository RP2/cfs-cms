<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { currentFolder } from '$lib/stores';
	import { uploadFiles } from '$lib/services/dataService';
	import { Upload, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) } = $props();
	let files = $state<FileList | null>(null);
	let uploading = $state(false);
	let error = $state<string | null>(null);

	function handleClose() {
		open = false;
		files = null;
		uploading = false;
		error = null;
	}

	async function handleUpload() {
		if (!files) {
			console.log('Upload: no files selected');
			return;
		}

		console.log('Upload: starting', {
			fileCount: files.length,
			folder: $currentFolder?.name || 'root'
		});
		uploading = true;
		error = null;

		try {
			console.log('Upload: calling uploadFiles');
			const uploaded = await uploadFiles(files);
			console.log('Upload: success', { uploaded });
			// Small delay to show success state before closing
			await new Promise((resolve) => setTimeout(resolve, 500));
			handleClose();
		} catch (err) {
			console.log('Upload: caught error', err);
			const message = err instanceof Error ? err.message : 'Upload failed';
			error = message;
			uploading = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Upload Files</DialogTitle>
			<DialogDescription>Upload files to {$currentFolder?.name || 'root'}</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div
				class="flex min-h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border"
			>
				<label for="file-input" class="flex flex-col items-center gap-2">
					<Upload class="h-8 w-8 text-muted-foreground" />
					<span class="text-sm text-muted-foreground">Click to select files or drag and drop</span>
					<input
						id="file-input"
						type="file"
						multiple
						bind:files
						class="hidden"
						disabled={uploading}
					/>
				</label>
			</div>
			{#if files && files.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium">{files.length} file(s) selected</p>
					<ul class="space-y-1 text-sm text-muted-foreground">
						{#each Array.from(files) as file}
							<li>{file.name}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={uploading}>Cancel</Button>
			<Button onclick={handleUpload} disabled={!files || files.length === 0 || uploading}>
				{#if uploading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Uploading...
				{:else}
					Upload
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
