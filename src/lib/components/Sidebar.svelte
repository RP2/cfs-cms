<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Label } from '$lib/components/ui/label';
	import { currentWorkspace, currentFolder, workspaceFolders } from '$lib/stores';
	import { mockWorkspaces, getSubfolders } from '$lib/data/mock';
	import type { Folder } from '$lib/types';
	import {
		Briefcase,
		House,
		Folder as FolderIcon,
		ChevronDown,
		ChevronRight,
		Star,
		Users,
		Tag,
		Plus,
		Trash2
	} from '@lucide/svelte';

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
		<Label class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">WORKSPACES</Label>
		<div class="space-y-1">
			{#each mockWorkspaces as workspace}
				<Button
					variant={$currentWorkspace?.id === workspace.id ? 'default' : 'ghost'}
					class="w-full justify-start"
					onclick={() => selectWorkspace(workspace)}
				>
					<Briefcase class="mr-2 h-4 w-4" />
					{workspace.name}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Navigation & Folders -->
	<div class="flex-1 space-y-1 overflow-y-auto p-4">
		<!-- Home -->
		<Button
			variant={$currentFolder === null ? 'default' : 'ghost'}
			class="w-full justify-start"
			onclick={() => selectFolder(null)}
		>
			<House class="mr-2 h-4 w-4" />
			Home
		</Button>

		<Separator class="my-2" />

		<!-- Folder Tree -->
		<Label class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">FOLDERS</Label>
		<Button variant="ghost" class="w-full justify-start">
			<Plus class="mr-2 h-4 w-4" />
			New Folder
		</Button>
		<div class="space-y-1">
			{#each getRootFolders() as folder (folder.id)}
				<div>
					<div class="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							class="h-6 w-6"
							onclick={() => toggleFolder(folder.id)}
						>
							{#if expandedFolders.has(folder.id)}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<ChevronRight class="h-4 w-4" />
							{/if}
						</Button>
						<Button
							variant={$currentFolder?.id === folder.id ? 'default' : 'ghost'}
							class="flex-1 justify-start"
							onclick={() => selectFolder(folder)}
						>
							<FolderIcon class="mr-2 h-4 w-4" />
							{folder.name}
						</Button>
					</div>

					<!-- Subfolders -->
					{#if expandedFolders.has(folder.id)}
						<div class="ml-6 space-y-1 border-l border-border pl-2">
							{#each getChildren(folder.id) as subfolder (subfolder.id)}
								<Button
									variant={$currentFolder?.id === subfolder.id ? 'default' : 'ghost'}
									class="w-full justify-start"
									onclick={() => selectFolder(subfolder)}
								>
									<FolderIcon class="mr-2 h-4 w-4" />
									{subfolder.name}
								</Button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<Separator class="my-2" />

		<!-- Quick Links -->
		<Label class="mb-2 text-xs font-semibold text-sidebar-accent-foreground">QUICK LINKS</Label>
		<Button variant="ghost" class="w-full justify-start">
			<Star class="mr-2 h-4 w-4" />
			Starred
		</Button>
		<Button variant="ghost" class="w-full justify-start">
			<Tag class="mr-2 h-4 w-4" />
			Tags
		</Button>
		<Button variant="ghost" class="w-full justify-start">
			<Trash2 class="mr-2 h-4 w-4" />
			Trash
		</Button>
	</div>
</aside>
