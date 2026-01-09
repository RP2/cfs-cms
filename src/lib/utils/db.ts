/**
 * Transform database snake_case fields to TypeScript camelCase
 * D1 returns: { workspace_id, parent_id, deleted_at, created_at, updated_at }
 * Types expect: { workspaceId, parentId, deletedAt, createdAt, updatedAt }
 *
 * Also converts date strings to Date objects for consistency with mock data
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
	const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'trashedUntil'];

	for (const [key, value] of Object.entries(obj)) {
		const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

		// Convert SQLite 1/0 to boolean true/false for any starred or boolean fields
		if ((key === 'starred' || camelKey === 'starred') && (value === 1 || value === 0)) {
			camelObj[camelKey] = value === 1;
		}
		// Convert date strings to Date objects
		else if (dateFields.includes(camelKey) && typeof value === 'string') {
			camelObj[camelKey] = new Date(value);
		} else {
			camelObj[camelKey] = value;
		}
	}

	return camelObj;
}
