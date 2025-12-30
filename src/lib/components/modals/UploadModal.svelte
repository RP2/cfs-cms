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
	import { currentFolder, currentWorkspace, currentFiles } from '$lib/stores';
	import { mockFiles } from '$lib/data/mock';
	import { Upload } from '@lucide/svelte';

	export let open = false;
	let files: FileList | null = null;
	let uploading = false;

	function handleClose() {
		open = false;
		files = null;
		uploading = false;
	}

	async function handleUpload() {
		if (!files || !$currentWorkspace || !$currentFolder) return;

		uploading = true;

		// Simulate upload delay
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Add mock files to store
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const newFile = {
				id: `file_${Date.now()}_${i}`,
				workspaceId: $currentWorkspace.id,
				folderId: $currentFolder.id,
				name: file.name,
				size: file.size,
				mimeType: file.type || 'application/octet-stream',
				storagePath: URL.createObjectURL(file), // Mock storage path
				uploadedBy: 'user_1', // Mock user
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null
			};
			mockFiles.push(newFile);
		}

		currentFiles.set([
			...mockFiles.filter((f) => !f.deletedAt && f.folderId === $currentFolder!.id)
		]);
		uploading = false;
		handleClose();
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
						on:change={() => {}}
						class="hidden"
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
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleUpload} disabled={!files || files.length === 0 || uploading}>
				{uploading ? 'Uploading...' : 'Upload'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
