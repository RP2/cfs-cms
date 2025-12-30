<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- Grid View Skeleton -->
<div class="space-y-4 p-6">
	<!-- Section Label -->
	<div class="h-5 w-24 rounded bg-muted"></div>

	<!-- Grid of Skeletons -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each Array(8) as _}
			<Card class="h-40">
				<CardContent class="h-full p-4">
					<!-- Icon Skeleton -->
					<div class="mb-2 flex justify-center">
						<Skeleton class="h-12 w-12 rounded" />
					</div>

					<!-- Title Skeleton -->
					<Skeleton class="mb-2 h-4 w-full rounded" />
					<Skeleton class="h-3 w-2/3 rounded" />
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
