<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		Briefcase,
		BookOpen,
		Glasses,
		Palette,
		Zap,
		Rocket,
		Target,
		Trophy,
		Lightbulb,
		Archive
	} from '@lucide/svelte';

	const iconMap = {
		briefcase: Briefcase,
		book: BookOpen,
		glasses: Glasses,
		palette: Palette,
		zap: Zap,
		rocket: Rocket,
		target: Target,
		trophy: Trophy,
		lightbulb: Lightbulb,
		archive: Archive
	};

	const icons = [
		{ id: 'briefcase', name: 'Briefcase' },
		{ id: 'book', name: 'Book' },
		{ id: 'glasses', name: 'Glasses' },
		{ id: 'palette', name: 'Palette' },
		{ id: 'zap', name: 'Lightning' },
		{ id: 'rocket', name: 'Rocket' },
		{ id: 'target', name: 'Target' },
		{ id: 'trophy', name: 'Trophy' },
		{ id: 'lightbulb', name: 'Idea' },
		{ id: 'archive', name: 'Archive' }
	];

	let { open = $bindable(false), onSelect = () => {} } = $props();

	function handleSelect(iconId: string) {
		onSelect(iconId);
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Select Workspace Icon</DialogTitle>
			<DialogDescription>Choose an icon to represent this workspace</DialogDescription>
		</DialogHeader>
		<div class="grid grid-cols-5 gap-3 py-4">
			{#each icons as icon (icon.id)}
				{@const IconComponent = iconMap[icon.id as keyof typeof iconMap]}
				<Button variant="outline" class="h-16 flex-col gap-2" onclick={() => handleSelect(icon.id)}>
					<IconComponent class="h-6 w-6" />
					<span class="text-xs text-muted-foreground">{icon.name}</span>
				</Button>
			{/each}
		</div>
	</DialogContent>
</Dialog>
