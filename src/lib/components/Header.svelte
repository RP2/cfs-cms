<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { viewType, searchQuery, currentWorkspace } from '$lib/stores';
	import { Grid3x3, List, User, Search } from '@lucide/svelte';

	let search = '';

	function handleSearch(e: any) {
		search = e.target.value;
		searchQuery.set(search);
	}

	function setViewGrid() {
		viewType.set('grid');
	}

	function setViewList() {
		viewType.set('list');
	}
</script>

<header class="sticky top-0 z-100 border-b bg-white">
	<div class="flex h-16 items-center justify-between gap-4 px-6 py-3">
		<!-- Logo & Workspace Name (Fixed width) -->
		<div class="flex w-64 shrink-0 items-center gap-3">
			<div class="text-xl font-bold text-accent">CFS CMS</div>
			{#if $currentWorkspace}
				<div class="truncate text-sm text-muted-foreground">/ {$currentWorkspace.name}</div>
			{/if}
		</div>

		<!-- Search Bar (Flexible) -->
		<div class="relative max-w-md min-w-0 flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search files, folders, tags..."
				value={search}
				oninput={handleSearch}
				class="pl-9"
			/>
		</div>

		<!-- Controls (Fixed width) -->
		<div class="flex shrink-0 items-center gap-4">
			<!-- Grid/List Toggle Buttons -->
			<ToggleGroup
				type="single"
				value={$viewType}
				onValueChange={(v) => v && viewType.set(v as 'grid' | 'list')}
			>
				<ToggleGroupItem value="grid" aria-label="Grid view">
					<Grid3x3 class="h-4 w-4" />
				</ToggleGroupItem>
				<ToggleGroupItem value="list" aria-label="List view">
					<List class="h-4 w-4" />
				</ToggleGroupItem>
			</ToggleGroup>

			<!-- User Menu -->
			<Button variant="ghost" size="icon" title="User menu">
				<User class="h-4 w-4" />
			</Button>
		</div>
	</div>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 100;
	}
</style>
