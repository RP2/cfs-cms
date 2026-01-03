/**
 * Transform database snake_case fields to TypeScript camelCase
 * D1 returns: { workspace_id, parent_id, deleted_at, created_at, updated_at }
 * Types expect: { workspaceId, parentId, deletedAt, createdAt, updatedAt }
 */
export function snakeToCamel(obj: any): any {
	if (!obj) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => snakeToCamel(item));
	}

	if (typeof obj !== 'object') {
		return obj;
	}

	const camelObj: any = {};

	for (const [key, value] of Object.entries(obj)) {
		const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
		camelObj[camelKey] = value;
	}

	return camelObj;
}
