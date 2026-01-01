<script lang="ts">
	import type { File } from '$lib/types';

	interface Props {
		file: File;
	}

	let { file }: Props = $props();

	// TODO Phase 2: Fetch and syntax-highlight actual file content
	let fileContent = $derived(
		`// Content preview for: ${file.name}\n// Actual file content loading in Phase 2...\n// Real syntax highlighting will be applied based on language`
	);
</script>

<div class="flex h-full flex-col overflow-auto rounded-lg bg-muted/30 p-4">
	<div class="mb-3 border-b pb-3 text-xs text-muted-foreground">
		<p class="font-mono">{file.name}</p>
	</div>
	<pre class="flex-1 font-mono text-xs wrap-break-word whitespace-pre-wrap text-foreground"><code
			>{fileContent}</code
		></pre>
</div>
