<script lang="ts">
	import type { File } from '$lib/types';
	import { File as FileIcon } from '@lucide/svelte';
	import { getFileExtension, getFileCategory } from '$lib/utils/fileMetadata';

	interface Props {
		file: File;
	}

	let { file }: Props = $props();

	let extension = $derived(getFileExtension(file.name));
	let category = $derived(getFileCategory(file.mimeType));
</script>

<div class="flex h-full items-center justify-center rounded-lg bg-muted/30 p-6">
	<div class="space-y-3 text-center">
		<FileIcon class="mx-auto h-16 w-16 text-muted-foreground" />
		<div>
			<p class="mb-1 text-sm font-medium text-foreground">{extension.toUpperCase()} File</p>
			<p class="text-xs text-muted-foreground capitalize">{category}</p>
			<p class="mt-2 text-xs text-muted-foreground">Preview not available for this file type</p>
		</div>
	</div>
</div>
