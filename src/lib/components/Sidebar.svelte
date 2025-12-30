<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { currentWorkspace, currentFolder, workspaceFolders } from '$lib/stores';
	import { mockWorkspaces, getSubfolders } from '$lib/data/mock';
	import type { Folder } from '$lib/types';

	let expandedFolders = new Set<string>();

	function toggleFolder(folderId: string) {
		if (expandedFolders.has(folderId)) {
			expandedFolders.delete(folderId);
		} else {
			expandedFolders.add(folderId);
		}
		expandedFolders = expandedFolders;
	}

	function selectFolder(folder: Folder | null) {
		currentFolder.set(folder);
	}

	function selectWorkspace(workspace: any) {
		currentWorkspace.set(workspace);
		currentFolder.set(null);
		expandedFolders = new Set();
	}

	function getRootFolders() {
		if (!$currentWorkspace) return [];
		return getSubfolders(null, $currentWorkspace.id);
	}

	function getChildren(parentId: string) {
		if (!$currentWorkspace) return [];
		return getSubfolders(parentId, $currentWorkspace.id);
	}
</script>

<aside class="flex h-full w-64 flex-col overflow-hidden border-r bg-sidebar">
	<!-- Workspace Selector -->
	<div class="border-b p-4">
		<div class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">WORKSPACES</div>
		<div class="space-y-1">
			{#each mockWorkspaces as workspace}
				<button
					class="w-full truncate rounded px-3 py-2 text-left text-sm {$currentWorkspace?.id ===
					workspace.id
						? 'bg-sidebar-primary text-sidebar-primary-foreground'
						: 'hover:bg-sidebar-accent'}"
					on:click={() => selectWorkspace(workspace)}
				>
					<span class="mr-2 text-lg">💼</span>
					{workspace.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Navigation & Folders -->
	<div class="flex-1 space-y-1 overflow-y-auto p-4">
		<!-- Home -->
		<button
			class="w-full rounded px-3 py-2 text-left {$currentFolder === null
				? 'bg-primary font-semibold text-primary-foreground'
				: 'hover:bg-sidebar-accent'}"
			on:click={() => selectFolder(null)}
		>
			<span class="mr-2 text-lg">⌂</span>
			Home
		</button>

		<Separator class="my-2" />

		<!-- Folder Tree -->
		<div class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">FOLDERS</div>
		<button
			class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-sidebar-accent"
		>
			<span>➕</span>
			<span>New Folder</span>
		</button>
		<div class="space-y-1">
			{#each getRootFolders() as folder (folder.id)}
				<div>
					<div class="flex items-center">
						<button
							class="flex h-6 w-6 items-center justify-center p-0 text-sm"
							on:click={() => toggleFolder(folder.id)}
						>
							{expandedFolders.has(folder.id) ? '▼' : '▶'}
						</button>
						<button
							class="flex-1 rounded px-2 py-2 text-left text-sm {$currentFolder?.id === folder.id
								? 'bg-primary font-semibold text-primary-foreground'
								: 'hover:bg-sidebar-accent'}"
							on:click={() => selectFolder(folder)}
						>
							<span class="mr-2 text-lg">📁</span>
							{folder.name}
						</button>
					</div>

					<!-- Subfolders -->
					{#if expandedFolders.has(folder.id)}
						<div class="ml-4 space-y-1">
							{#each getChildren(folder.id) as subfolder (subfolder.id)}
								<button
									class="w-full rounded px-3 py-2 text-left text-sm {$currentFolder?.id ===
									subfolder.id
										? 'bg-sidebar-primary text-sidebar-primary-foreground'
										: 'hover:bg-sidebar-accent'}"
									on:click={() => selectFolder(subfolder)}
								>
									<span class="mr-2 text-lg">📂</span>
									{subfolder.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<Separator class="my-2" />

		<!-- Quick Links -->
		<div class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">QUICK LINKS</div>
		<button class="w-full rounded px-3 py-2 text-left hover:bg-sidebar-accent">
			<span class="mr-2 text-lg">⭐</span>
			Starred
		</button>
		<button class="w-full rounded px-3 py-2 text-left hover:bg-sidebar-accent">
			<span class="mr-2 text-lg">👥</span>
			Shared with Me
		</button>
		<button class="w-full rounded px-3 py-2 text-left hover:bg-sidebar-accent">
			<span class="mr-2 text-lg">🔖</span>
			Tags
		</button>
	</div>
</aside>
