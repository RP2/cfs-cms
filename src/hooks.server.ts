import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { createRemoteJWKSet, jwtVerify } from 'jose';

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(teamDomain: string) {
	if (!cachedJwks) {
		cachedJwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
	}
	return cachedJwks;
}

export const handle: Handle = async ({ event, resolve }) => {
	const audience = event.platform?.env?.POLICY_AUD;
	const teamDomain = event.platform?.env?.TEAM_DOMAIN;

	if (!audience || !teamDomain) {
		console.warn('Access JWT env not configured: POLICY_AUD / TEAM_DOMAIN');
		return resolve(event);
	}

	const token = event.request.headers.get('cf-access-jwt-assertion');
	if (!token) throw error(401, 'Unauthorized');

	try {
		const jwks = getJwks(teamDomain);
		const { payload } = await jwtVerify(token, jwks, {
			audience,
			issuer: teamDomain
		});
		event.locals.user = {
			email: typeof payload.email === 'string' ? payload.email : undefined,
			sub: typeof payload.sub === 'string' ? payload.sub : undefined
		};
		return resolve(event);
	} catch (err) {
		console.error('Access JWT verification failed:', err instanceof Error ? err.message : err);
		throw error(401, 'Unauthorized');
	}
};
