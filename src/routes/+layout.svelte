<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen flex-col bg-background">
	<!-- Header -->
	<Header />

	<!-- Main Content Area -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<Sidebar />

		<!-- Content Area -->
		<main class="flex-1 overflow-y-auto">
			<FileGrid />
		</main>
	</div>
</div>
