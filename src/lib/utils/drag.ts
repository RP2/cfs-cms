export const DRAG_ARM_DELAY_MS = 30;
export const DRAG_MOVE_THRESHOLD_PX = 8;

export type DragPayload = {
	type: 'file' | 'folder';
	ids: string[];
};

export type DragController = {
	pointerDown: (id: string, point: { x: number; y: number }) => void;
	pointerMove: (point: { x: number; y: number }) => void;
	pointerEnd: () => void;
	isReady: (id: string) => boolean;
	clear: () => void;
};

export function buildDragPayload(
	primaryId: string,
	selected: Set<string>,
	type: DragPayload['type']
) {
	return {
		type,
		ids: selected.has(primaryId) ? Array.from(selected) : [primaryId]
	} as DragPayload;
}

export function setDragData(event: DragEvent, payload: DragPayload) {
	const dt = event.dataTransfer;
	if (!dt) return;
	dt.effectAllowed = 'move';
	dt.setData('application/json', JSON.stringify(payload));
}

export function parseDragData(event: DragEvent): DragPayload | null {
	const dt = event.dataTransfer;
	if (!dt) return null;
	const raw = dt.getData('application/json');
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || !Array.isArray(parsed.ids) || typeof parsed.type !== 'string') return null;
		return parsed as DragPayload;
	} catch (err) {
		console.error('Invalid drag payload', err);
		return null;
	}
}

export function allowMoveDrop(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

export function setDragImageFromTarget(event: DragEvent, maxOffset = 32) {
	const target = event.currentTarget as HTMLElement | null;
	if (!target || !event.dataTransfer) return;
	const rect = target.getBoundingClientRect();
	const offsetX = rect.width / 2;
	const offsetY = Math.min(maxOffset, rect.height / 2);
	event.dataTransfer.setDragImage(target, offsetX, offsetY);
}

export function createDragController(
	delayMs = DRAG_ARM_DELAY_MS,
	moveThreshold = DRAG_MOVE_THRESHOLD_PX
): DragController {
	let readyId: string | null = null;
	let pendingId: string | null = null;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let startPoint: { x: number; y: number } | null = null;

	function clear() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		readyId = null;
		pendingId = null;
		startPoint = null;
	}

	function pointerDown(id: string, point: { x: number; y: number }) {
		clear();
		pendingId = id;
		startPoint = point;
		timer = setTimeout(() => {
			readyId = pendingId;
		}, delayMs);
	}

	function pointerMove(point: { x: number; y: number }) {
		if (!pendingId || !startPoint || readyId) return;
		const dx = point.x - startPoint.x;
		const dy = point.y - startPoint.y;
		if (dx * dx + dy * dy >= moveThreshold * moveThreshold) {
			readyId = pendingId;
		}
	}

	function pointerEnd() {
		clear();
	}

	function isReady(id: string) {
		return readyId === id;
	}

	return {
		pointerDown,
		pointerMove,
		pointerEnd,
		isReady,
		clear
	};
}
