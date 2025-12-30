<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbSeparator,
		BreadcrumbPage,
		BreadcrumbEllipsis
	} from '$lib/components/ui/breadcrumb';
	import { Input } from '$lib/components/ui/input';
	import { Search } from '@lucide/svelte';
	import { currentFolder, currentWorkspace } from '$lib/stores';
	import { mockFolders } from '$lib/data/mock';
	import type { Folder } from '$lib/types';

	let { children } = $props();
	let search = $state('');

	// Build full breadcrumb path from current folder to workspace root
	function getBreadcrumbPath(): Folder[] {
		if (!$currentFolder) return [];

		const path: Folder[] = [];
		let current: Folder | undefined = $currentFolder;

		while (current) {
			path.unshift(current);
			current = mockFolders.find((f) => f.id === current?.parentId);
		}

		return path;
	}

	// Navigate to a folder by clicking breadcrumb
	function navigateToFolder(folder: Folder | null) {
		currentFolder.set(folder);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<!-- Header with Search and Breadcrumbs -->
		<header
			class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4"
		>
			<Sidebar.Trigger class="-ml-1" />

			<!-- Search -->
			<div class="relative min-w-0 flex-1 md:max-w-md">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search files, folders, tags..."
					bind:value={search}
					class="pl-9"
				/>
			</div>

			<!-- Breadcrumbs (hidden on mobile) -->
			<div class="ml-auto hidden items-center gap-2 md:flex">
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
		</header>

		<!-- Main Content -->
		<main class="flex flex-1 flex-col overflow-hidden">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
