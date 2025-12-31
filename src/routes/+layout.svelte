<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Combobox } from '$lib/components/ui/combobox';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbSeparator,
		BreadcrumbPage
	} from '$lib/components/ui/breadcrumb';
	import { Search, Folder as FolderIcon, File as FileIcon } from '@lucide/svelte';
	import { currentFiles, currentFolder, currentWorkspace, workspaceFolders } from '$lib/stores';
	import type { Folder } from '$lib/types';

	type SearchOption = {
		id: string;
		label: string;
		type: 'file' | 'folder';
		folderId: string | null;
	};

	let { children } = $props();

	let searchOptions = $derived(
		$currentWorkspace
			? [
					...$workspaceFolders
						.filter((folder) => folder.workspaceId === $currentWorkspace.id && !folder.deletedAt)
						.map((folder) => ({
							id: folder.id,
							label: folder.name,
							type: 'folder' as const,
							folderId: folder.id
						})),
					...$currentFiles
						.filter((file) => file.workspaceId === $currentWorkspace.id && !file.deletedAt)
						.map((file) => ({
							id: file.id,
							label: file.name,
							type: 'file' as const,
							folderId: file.folderId
						}))
				]
			: []
	);

	let searchOptionMap = $derived(new Map(searchOptions.map((item) => [item.id, item])));
	let searchItemsList = $derived(
		searchOptions.map(({ id, label, type, folderId }) => ({
			id,
			label,
			description: buildPath(folderId),
			icon: type === 'folder' ? FolderIcon : FileIcon
		}))
	);

	function buildPath(folderId: string | null): string {
		const path: string[] = [];
		let current = $workspaceFolders.find((f) => f.id === folderId);

		while (current) {
			path.unshift(current.name);
			current = $workspaceFolders.find((f) => f.id === current?.parentId);
		}

		return path.join(' / ') || 'Workspace Root';
	}

	// Build full breadcrumb path from current folder to workspace root
	function getBreadcrumbPath(): Folder[] {
		if (!$currentFolder) return [];

		const path: Folder[] = [];
		let current: Folder | undefined = $currentFolder;

		while (current) {
			path.unshift(current);
			// Use the store instead of mockFolders directly
			current = $workspaceFolders.find((f) => f.id === current?.parentId);
		}

		return path;
	}

	// Navigate to a folder by clicking breadcrumb
	function navigateToFolder(folder: Folder | null) {
		currentFolder.set(folder);
	}

	// Handle search result selection
	function handleSearchSelect(event: CustomEvent<{ id: string; label: string }>) {
		const selected = searchOptionMap.get(event.detail.id);
		if (!selected) return;

		if (selected.type === 'folder') {
			const folder = $workspaceFolders.find((f) => f.id === selected.id);
			if (folder) navigateToFolder(folder);
		} else if (selected.folderId) {
			const folder = $workspaceFolders.find((f) => f.id === selected.folderId);
			if (folder) navigateToFolder(folder);
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<!-- Header with Breadcrumbs and Search -->
		<header
			class="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4"
		>
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<Sidebar.Trigger class="-ml-1" />

				<!-- Breadcrumbs (left side) -->
				<div class="hidden md:block">
					<Breadcrumb>
						<BreadcrumbList>
							<!-- Workspace as root -->
							{#if $currentWorkspace}
								<BreadcrumbItem>
									<BreadcrumbLink href="#" onclick={() => navigateToFolder(null)}>
										{$currentWorkspace.name}
									</BreadcrumbLink>
								</BreadcrumbItem>
							{/if}

							<!-- Folder path -->
							{#each getBreadcrumbPath() as folder, index}
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									{#if index === getBreadcrumbPath().length - 1}
										<!-- Current folder (non-clickable) -->
										<BreadcrumbPage>{folder.name}</BreadcrumbPage>
									{:else}
										<!-- Parent folders (clickable) -->
										<BreadcrumbLink href="#" onclick={() => navigateToFolder(folder)}>
											{folder.name}
										</BreadcrumbLink>
									{/if}
								</BreadcrumbItem>
							{/each}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			<!-- Search (top right) -->
			<div class="w-10/12 min-w-0 md:max-w-xl">
				<div class="relative">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Combobox
						items={searchItemsList}
						placeholder="Search files & folders..."
						emptyMessage="No matches found"
						openOnFocus={true}
						inputClass="pl-10"
						on:select={handleSearchSelect}
					/>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex flex-1 flex-col overflow-hidden">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
