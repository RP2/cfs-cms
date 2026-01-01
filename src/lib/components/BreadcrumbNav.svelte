<script lang="ts">
	import {
		Breadcrumb,
		BreadcrumbList,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbSeparator,
		BreadcrumbPage,
		BreadcrumbEllipsis
	} from '$lib/components/ui/breadcrumb';
	import { getWorkspaceIconComponent } from './modals/IconPickerModal.svelte';
	import type { Folder, Workspace } from '$lib/types';

	interface Props {
		currentWorkspace: Workspace | null;
		currentFolder: Folder | null;
		folderPath: Folder[];
		onNavigate: (folder: Folder | null) => void;
		variant?: 'desktop' | 'mobile';
	}

	let {
		currentWorkspace,
		currentFolder,
		folderPath,
		onNavigate,
		variant = 'desktop'
	}: Props = $props();

	// Desktop: Show all folders with truncation (only collapse if >3 folders)
	// Mobile: Show ellipsis per level, dash when >3 levels
	let breadcrumbItems = $derived.by(() => {
		if (!currentFolder || folderPath.length === 0) return [];

		if (variant === 'desktop') {
			const maxFolders = 3; // Show full path up to 3 folders before collapsing (tablet-friendly)

			if (folderPath.length <= maxFolders) {
				// Show all folders with full names (text will truncate)
				return folderPath.slice(0, -1).map((folder, index) => ({
					type: 'folder' as const,
					folder,
					key: `folder-${index}`
				}));
			}

			// Too many folders - use dash to indicate skipped folders
			// Pattern: Folder1 / — / Last / Current
			const result = [];
			const firstCount = 1;
			const lastCount = 1;

			// First folders
			for (let i = 0; i < firstCount; i++) {
				result.push({
					type: 'folder' as const,
					folder: folderPath[i],
					key: `folder-${i}`
				});
			}

			// Dash separator (indicates skipped folders)
			result.push({
				type: 'dash' as const,
				folder: folderPath[firstCount],
				key: 'dash-middle'
			});

			// Last folders (before current)
			for (let i = folderPath.length - 1 - lastCount; i < folderPath.length - 1; i++) {
				result.push({
					type: 'folder' as const,
					folder: folderPath[i],
					key: `folder-${i}`
				});
			}

			return result;
		}

		// Mobile: Show ellipsis per level
		const maxEllipsis = 3;

		if (folderPath.length <= maxEllipsis) {
			// Show ellipsis for each level
			return folderPath.slice(0, -1).map((folder, index) => ({
				type: 'ellipsis' as const,
				folder,
				key: `ellipsis-${index}`
			}));
		}

		// Too many levels - show first ellipsis, dash, last ellipsis
		const result = [];
		result.push({
			type: 'ellipsis' as const,
			folder: folderPath[0],
			key: 'ellipsis-0'
		});

		result.push({
			type: 'dash' as const,
			folder: folderPath[Math.floor(folderPath.length / 2)],
			key: 'dash-middle'
		});

		result.push({
			type: 'ellipsis' as const,
			folder: folderPath[folderPath.length - 2],
			key: `ellipsis-${folderPath.length - 2}`
		});

		return result;
	});
</script>

<Breadcrumb>
	<BreadcrumbList class="flex-nowrap {variant === 'mobile' ? 'min-h-6' : ''}">
		<!-- Workspace root -->
		{#if currentWorkspace}
			{@const IconComponent = getWorkspaceIconComponent(currentWorkspace)}
			<BreadcrumbItem class={variant === 'desktop' ? 'shrink-0' : ''}>
				<BreadcrumbLink href="#" onclick={() => onNavigate(null)} class="flex items-center gap-1.5">
					{#if variant === 'mobile'}
						<IconComponent class="h-4 w-4 shrink-0" />
					{/if}
					{#if variant === 'desktop'}
						<!-- Desktop: Show icon only when in folders, icon+name at root -->
						<IconComponent class="h-4 w-4 shrink-0" />
						{#if !currentFolder}
							<span class="max-w-80 truncate">
								{currentWorkspace.name}
							</span>
						{/if}
					{:else if !currentFolder}
						<!-- Show workspace name on mobile only when at root -->
						<span class="truncate">{currentWorkspace.name}</span>
					{/if}
				</BreadcrumbLink>
			</BreadcrumbItem>
		{/if}

		<!-- Folder path -->
		{#if currentFolder}
			<BreadcrumbSeparator class="shrink-0" />

			<!-- Show folders or ellipsis based on variant and depth -->
			{#each breadcrumbItems as item (item.key)}
				{#if item.type === 'folder'}
					<BreadcrumbItem class={variant === 'desktop' ? 'min-w-0 overflow-hidden' : ''}>
						<BreadcrumbLink
							href="#"
							onclick={() => onNavigate(item.folder)}
							class={variant === 'desktop' ? 'max-w-28 truncate' : ''}
						>
							{item.folder.name}
						</BreadcrumbLink>
					</BreadcrumbItem>
				{:else if item.type === 'ellipsis'}
					<BreadcrumbItem class="shrink-0">
						{#if variant === 'desktop'}
							<BreadcrumbEllipsis class="h-4 w-4" />
						{:else}
							<BreadcrumbEllipsis class="h-4 w-4" onclick={() => onNavigate(item.folder)} />
						{/if}
					</BreadcrumbItem>
				{:else}
					<!-- Dash separator for collapsed levels -->
					<BreadcrumbItem class="shrink-0">
						<span class="px-1 text-muted-foreground">—</span>
					</BreadcrumbItem>
				{/if}
				<BreadcrumbSeparator class="shrink-0" />
			{/each}

			<!-- Current folder (non-clickable) -->
			<BreadcrumbItem class={variant === 'desktop' ? 'min-w-0 overflow-hidden' : ''}>
				<BreadcrumbPage class={variant === 'desktop' ? 'max-w-28 truncate' : ''}>
					{currentFolder.name}
				</BreadcrumbPage>
			</BreadcrumbItem>
		{/if}
	</BreadcrumbList>
</Breadcrumb>
