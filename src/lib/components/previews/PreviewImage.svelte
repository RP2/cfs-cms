<script lang="ts">
	import type { File } from '$lib/types';
	import { FileImage } from '@lucide/svelte';

	interface Props {
		file: File;
	}

	let { file }: Props = $props();
</script>

<div class="flex h-full items-center justify-center rounded-lg bg-muted/30 p-6">
	<div class="space-y-4 text-center">
		<FileImage class="mx-auto h-16 w-16 text-muted-foreground" />
		<div>
			<p class="mb-1 text-sm font-medium text-foreground">Image Preview</p>
			<p class="text-xs text-muted-foreground">Phase 1: Mock files don't exist on disk</p>
			<p class="mt-2 text-xs text-muted-foreground">Real image preview coming in Phase 2</p>
		</div>
	</div>
</div>
