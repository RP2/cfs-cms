<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import type { MenuItem } from './menuBuilder';

	interface Props {
		items: MenuItem[];
	}

	let { items }: Props = $props();
</script>

<ContextMenu.Content>
	{#each items as item (item)}
		{#if item.kind === 'separator'}
			<ContextMenu.Separator />
		{:else}
			<ContextMenu.Item variant={item.variant} disabled={item.disabled} onclick={item.action}>
				{#if item.icon}
					{@const Icon = item.icon}
					<Icon class="mr-2 h-4 w-4" />
				{/if}
				{item.label}
			</ContextMenu.Item>
		{/if}
	{/each}
</ContextMenu.Content>
