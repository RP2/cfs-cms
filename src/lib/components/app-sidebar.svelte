<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { currentWorkspace, currentFolder, viewType } from '$lib/stores';
	import { mockWorkspaces, getSubfolders } from '$lib/data/mock';
	import type { Folder } from '$lib/types';
	import FolderItem from './FolderItem.svelte';
	import { Briefcase, Star, Tag, Plus, Trash2, Grid3x3, List, User } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	function selectWorkspace(workspace: any) {
		currentWorkspace.set(workspace);
		currentFolder.set(null);
	}

	function getRootFolders() {
		if (!$currentWorkspace) return [];
		return getSubfolders(null, $currentWorkspace.id);
	}
</script>

<Sidebar.Root {collapsible} {...restProps} bind:ref>
	<!-- Workspace Selector Header -->
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
					>
						<Briefcase class="size-4" />
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">
							{$currentWorkspace?.name || 'Select Workspace'}
						</span>
						<span class="truncate text-xs">Content Management</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<!-- Workspace List -->
		<Sidebar.Separator />
		<Sidebar.Menu>
			<Sidebar.GroupLabel>WORKSPACES</Sidebar.GroupLabel>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					<Plus class="size-4" />
					<span>New Workspace</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			{#each mockWorkspaces as workspace}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={$currentWorkspace?.id === workspace.id}
						onclick={() => selectWorkspace(workspace)}
					>
						<Briefcase class="size-4" />
						<span>{workspace.name}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>

		<!-- Remove MenuAction -->
	</Sidebar.Header>

	<!-- Main Navigation -->
	<Sidebar.Content>
		<!-- Folders -->
		<Sidebar.Separator />
		<Sidebar.Group>
			<Sidebar.GroupLabel>FOLDERS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Plus class="size-4" />
						<span>New Folder</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>

				{#each getRootFolders() as folder (folder.id)}
					<FolderItem {folder} />
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Quick Links -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>QUICK LINKS</Sidebar.GroupLabel>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Star class="size-4" />
						<span>Starred</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Tag class="size-4" />
						<span>Tags</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						<Trash2 class="size-4" />
						<span>Trash</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>

	<!-- Footer with View Toggle & User -->
	<Sidebar.Footer>
		<Sidebar.Separator />
		<!-- View Toggle -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					title={$viewType === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
					onclick={() => viewType.set($viewType === 'grid' ? 'list' : 'grid')}
				>
					{#if $viewType === 'grid'}
						<Grid3x3 class="h-4 w-4" />
						<span>Grid View</span>
					{:else}
						<List class="h-4 w-4" />
						<span>List View</span>
					{/if}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<Sidebar.Separator />

		<!-- User Menu -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					<Avatar class="h-8 w-8 rounded-lg">
						<AvatarFallback class="rounded-lg">
							<User class="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">User Account</span>
						<span class="truncate text-xs">user@example.com</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
