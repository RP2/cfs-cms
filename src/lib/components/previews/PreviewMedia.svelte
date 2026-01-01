<script lang="ts">
	import type { File } from '$lib/types';
	import { FileVideoCamera, FileAudio } from '@lucide/svelte';
	import { getFileCategory } from '$lib/utils/fileMetadata';

	interface Props {
		file: File;
	}

	let { file }: Props = $props();

	let category = $derived(getFileCategory(file.mimeType));
	let isAudio = $derived(category === 'audio');
</script>

<div class="flex h-full items-center justify-center rounded-lg bg-muted/30 p-6">
	<div class="space-y-4 text-center">
		{#if isAudio}
			<FileAudio class="mx-auto h-16 w-16 text-muted-foreground" />
		{:else}
			<FileVideoCamera class="mx-auto h-16 w-16 text-muted-foreground" />
		{/if}
		<div>
			<p class="mb-1 text-sm font-medium text-foreground">
				{isAudio ? 'Audio' : 'Video'} Preview
			</p>
			<p class="text-xs text-muted-foreground">Phase 1: Mock files don't exist on disk</p>
			<p class="mt-2 text-xs text-muted-foreground">Full media player coming in Phase 2</p>
		</div>
	</div>
</div>
