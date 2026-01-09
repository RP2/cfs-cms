/**
 * API Integration Tests
 * Run against wrangler dev or production
 *
 * Usage:
 *   npm test:api              (runs against localhost:5173)
 *   TEST_URL=https://your-worker.workers.dev npm test:api
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_URL = `${BASE_URL}/api`;

// Test state
let testWorkspaceId: string;
let testFolderId: string;
let testFileId: string;
let testTagId: string;

describe('API Integration Tests', () => {
	describe('Workspaces', () => {
		it('should create a workspace', async () => {
			const response = await fetch(`${API_URL}/workspaces`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test Workspace',
					description: 'Created by automated tests',
					icon: '🧪'
				})
			});

			expect(response.status).toBe(201);
			const workspace = await response.json();
			expect(workspace.id).toBeDefined();
			expect(workspace.name).toBe('Test Workspace');
			testWorkspaceId = workspace.id;
		});

		it('should list workspaces', async () => {
			const response = await fetch(`${API_URL}/workspaces`);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.workspaces)).toBe(true);
			expect(data.workspaces.length).toBeGreaterThan(0);
		});

		it('should update a workspace', async () => {
			const response = await fetch(`${API_URL}/workspaces/${testWorkspaceId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Updated Test Workspace'
				})
			});

			expect(response.status).toBe(200);
			const workspace = await response.json();
			expect(workspace.name).toBe('Updated Test Workspace');
		});
	});

	describe('Folders', () => {
		it('should create a folder', async () => {
			const response = await fetch(`${API_URL}/folders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					workspaceId: testWorkspaceId,
					parentId: null,
					name: 'Test Folder'
				})
			});

			expect(response.status).toBe(201);
			const folder = await response.json();
			expect(folder.id).toBeDefined();
			expect(folder.name).toBe('Test Folder');
			testFolderId = folder.id;
		});

		it('should list folders', async () => {
			const response = await fetch(`${API_URL}/folders?workspaceId=${testWorkspaceId}`);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.folders)).toBe(true);
		});

		it('should rename a folder', async () => {
			const response = await fetch(`${API_URL}/folders/${testFolderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Renamed Test Folder' })
			});

			expect(response.status).toBe(200);
			const folder = await response.json();
			expect(folder.name).toBe('Renamed Test Folder');
		});

		it('should star a folder', async () => {
			const response = await fetch(`${API_URL}/folders/${testFolderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ starred: true })
			});

			expect(response.status).toBe(200);
			const folder = await response.json();
			expect(folder.starred).toBe(true);
		});
	});

	describe('Files', () => {
		it('should upload a file', async () => {
			// Create a test file (base64 encoded)
			const testContent = 'Hello from automated test!';
			const base64Content = Buffer.from(testContent).toString('base64');

			const response = await fetch(`${API_URL}/files`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					file: base64Content,
					fileName: 'test.txt',
					fileType: 'text/plain',
					fileSize: testContent.length,
					workspaceId: testWorkspaceId,
					folderId: testFolderId,
					name: 'test.txt'
				})
			});

			expect(response.status).toBe(201);
			const file = await response.json();
			expect(file.id).toBeDefined();
			expect(file.name).toBe('test.txt');
			testFileId = file.id;
		});

		it('should list files', async () => {
			const response = await fetch(`${API_URL}/files?workspaceId=${testWorkspaceId}`);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data.files)).toBe(true);
		});

		it('should rename a file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'renamed-test.txt' })
			});

			expect(response.status).toBe(200);
			const file = await response.json();
			expect(file.name).toBe('renamed-test.txt');
		});

		it('should star a file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ starred: true })
			});

			expect(response.status).toBe(200);
			const file = await response.json();
			expect(file.starred).toBe(true);
		});

		it('should download a file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}/download`);
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toBe('text/plain');
		});
	});

	describe('Tags', () => {
		it('should create a tag', async () => {
			const response = await fetch(`${API_URL}/tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					workspaceId: testWorkspaceId,
					name: 'Test Tag',
					color: 'accent'
				})
			});

			expect([200, 201]).toContain(response.status);
			const tag = await response.json();
			expect(tag.id).toBeDefined();
			expect(tag.name).toBe('test tag'); // Normalized
			testTagId = tag.id;
		});

		it('should add tag to file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}/tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tagNames: ['Test Tag']
				})
			});

			if (response.status !== 200) {
				const error = await response.json();
				console.error('Add tag error:', error);
			}

			expect([200, 201]).toContain(response.status);
		});
	});

	describe('File Operations', () => {
		it('should move a file', async () => {
			const response = await fetch(`${API_URL}/files/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileIds: [testFileId],
					targetFolderId: null, // Move to workspace root
					targetWorkspaceId: testWorkspaceId
				})
			});

			expect(response.status).toBe(200);
		});

		it('should copy a file', async () => {
			const response = await fetch(`${API_URL}/files/copy`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileIds: [testFileId],
					targetFolderId: testFolderId
				})
			});

			expect(response.status).toBe(201);
			const data = await response.json();
			expect(data.copiedCount).toBeGreaterThan(0);
		});
	});

	describe('Trash', () => {
		it('should soft delete a file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}`, {
				method: 'DELETE'
			});

			expect(response.status).toBe(200);
		});

		it('should list trash items', async () => {
			const response = await fetch(`${API_URL}/trash?workspaceId=${testWorkspaceId}`);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.files).toBeDefined();
		});

		it('should restore a file', async () => {
			const response = await fetch(`${API_URL}/files/${testFileId}/restore`, {
				method: 'POST'
			});

			expect(response.status).toBe(200);
		});

		it('should permanently delete a file', async () => {
			// Delete first
			await fetch(`${API_URL}/files/${testFileId}`, { method: 'DELETE' });

			// Then permanently delete
			const response = await fetch(`${API_URL}/files/${testFileId}?permanent=true`, {
				method: 'DELETE'
			});

			expect(response.status).toBe(200);
		});
	});

	describe('Search', () => {
		it('should search files', async () => {
			const response = await fetch(`${API_URL}/search?query=test&workspaceId=${testWorkspaceId}`);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.results).toBeDefined();
		});
	});

	describe('Cleanup', () => {
		it('should delete test folder', async () => {
			const response = await fetch(`${API_URL}/folders/${testFolderId}`, {
				method: 'DELETE'
			});

			expect([200, 404]).toContain(response.status); // May be already deleted
		});

		it('should delete test workspace', async () => {
			const response = await fetch(`${API_URL}/workspaces/${testWorkspaceId}`, {
				method: 'DELETE'
			});

			if (response.status !== 200 && response.status !== 409) {
				const error = await response.json();
				console.error('Delete workspace error:', error);
			}
			// Expect 200 (empty workspace deleted successfully)
			expect(response.status).toBe(200);
		});
	});
});
