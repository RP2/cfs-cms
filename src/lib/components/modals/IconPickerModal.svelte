<script lang="ts" module>
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
		Archive,
		Star,
		Grid3x3,
		Tag,
		Heart,
		Users,
		Settings,
		Code,
		Camera,
		Music,
		Video,
		Image,
		Map,
		Database,
		Lock,
		Mail,
		Phone,
		Calendar,
		Clock,
		Check,
		AlertCircle
	} from '@lucide/svelte';
	import type { Workspace } from '$lib/types';

	export type WorkspaceIcon =
		| 'briefcase'
		| 'book'
		| 'glasses'
		| 'palette'
		| 'zap'
		| 'rocket'
		| 'target'
		| 'trophy'
		| 'lightbulb'
		| 'archive'
		| 'star'
		| 'grid'
		| 'tag'
		| 'heart'
		| 'users'
		| 'settings'
		| 'code'
		| 'camera'
		| 'music'
		| 'video'
		| 'image'
		| 'map'
		| 'database'
		| 'lock'
		| 'mail'
		| 'phone'
		| 'calendar'
		| 'clock'
		| 'check'
		| 'alert';

	export const workspaceIconMap: Record<WorkspaceIcon, typeof Briefcase> = {
		briefcase: Briefcase,
		book: BookOpen,
		glasses: Glasses,
		palette: Palette,
		zap: Zap,
		rocket: Rocket,
		target: Target,
		trophy: Trophy,
		lightbulb: Lightbulb,
		archive: Archive,
		star: Star,
		grid: Grid3x3,
		tag: Tag,
		heart: Heart,
		users: Users,
		settings: Settings,
		code: Code,
		camera: Camera,
		music: Music,
		video: Video,
		image: Image,
		map: Map,
		database: Database,
		lock: Lock,
		mail: Mail,
		phone: Phone,
		calendar: Calendar,
		clock: Clock,
		check: Check,
		alert: AlertCircle
	};

	export function getWorkspaceIconComponent(workspace: Workspace) {
		const iconName = (workspace.icon as WorkspaceIcon) ?? 'briefcase';
		return workspaceIconMap[iconName];
	}
</script>

<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

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
		{ id: 'archive', name: 'Archive' },
		{ id: 'star', name: 'Star' },
		{ id: 'grid', name: 'Grid' },
		{ id: 'tag', name: 'Tag' },
		{ id: 'heart', name: 'Heart' },
		{ id: 'users', name: 'Team' },
		{ id: 'settings', name: 'Settings' },
		{ id: 'code', name: 'Code' },
		{ id: 'camera', name: 'Camera' },
		{ id: 'music', name: 'Music' },
		{ id: 'video', name: 'Video' },
		{ id: 'image', name: 'Image' },
		{ id: 'map', name: 'Map' },
		{ id: 'database', name: 'Database' },
		{ id: 'lock', name: 'Secure' },
		{ id: 'mail', name: 'Mail' },
		{ id: 'phone', name: 'Phone' },
		{ id: 'calendar', name: 'Calendar' },
		{ id: 'clock', name: 'Clock' },
		{ id: 'check', name: 'Check' },
		{ id: 'alert', name: 'Alert' }
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
				{@const IconComponent = workspaceIconMap[icon.id as WorkspaceIcon] || Briefcase}
				<Button variant="outline" class="h-16 flex-col gap-2" onclick={() => handleSelect(icon.id)}>
					<IconComponent class="h-6 w-6" />
					<span class="text-xs text-muted-foreground">{icon.name}</span>
				</Button>
			{/each}
		</div>
	</DialogContent>
</Dialog>
