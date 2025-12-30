<script lang="ts">
import { Button } from '$lib/components/ui/button';
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

<header class="border-b bg-white sticky top-0 z-100">
<div class="flex items-center justify-between gap-4 px-6 py-3 h-16">
<!-- Logo & Workspace Name (Fixed width) -->
<div class="flex items-center gap-3 shrink-0 w-64">
<div class="text-xl font-bold text-accent">CFS CMS</div>
{#if $currentWorkspace}
<div class="text-sm text-muted-foreground truncate">/ {$currentWorkspace.name}</div>
{/if}
</div>

<!-- Search Bar (Flexible) -->
<div class="flex-1 min-w-0 max-w-md flex items-center gap-2 px-3 py-2 border rounded-md bg-input">
<Search class="h-4 w-4 text-muted-foreground shrink-0" />
<input
type="text"
placeholder="Search files, folders, tags..."
value={search}
on:input={handleSearch}
class="w-full bg-transparent outline-none text-sm"
/>
</div>

<!-- Controls (Fixed width) -->
<div class="flex items-center gap-4 shrink-0">
<!-- Grid/List Toggle Buttons -->
<div class="flex gap-1 border rounded-md p-1">
<button
class="p-2 rounded {$viewType === 'grid'
? 'bg-accent text-accent-foreground'
: 'hover:bg-muted'}"
title="Grid view"
on:click={setViewGrid}
>
<Grid3x3 class="h-4 w-4" />
</button>
<button
class="p-2 rounded {$viewType === 'list'
? 'bg-accent text-accent-foreground'
: 'hover:bg-muted'}"
title="List view"
on:click={setViewList}
>
<List class="h-4 w-4" />
</button>
</div>

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
