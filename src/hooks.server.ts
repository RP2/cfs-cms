import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { createRemoteJWKSet, jwtVerify } from 'jose';

let cachedJwksUrl: string | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(jwksUrl: string) {
	if (cachedJwks && cachedJwksUrl === jwksUrl) return cachedJwks;
	cachedJwksUrl = jwksUrl;
	cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
	return cachedJwks;
}

export const handle: Handle = async ({ event, resolve }) => {
	const audience = event.platform?.env?.CLOUDFLARE_ACCESS_AUD;
	const jwksUrl = event.platform?.env?.CLOUDFLARE_ACCESS_JWKS_URL;

	if (!audience || !jwksUrl) {
		console.warn(
			'Access JWT env not configured: CLOUDFLARE_ACCESS_AUD / CLOUDFLARE_ACCESS_JWKS_URL'
		);
		return resolve(event); // allow build/preview but note missing auth configuration
	}

	const token = event.request.headers.get('cf-access-jwt-assertion');
	if (!token) throw error(401, 'Unauthorized');

	try {
		const issuer = jwksUrl.replace('/cdn-cgi/access/certs', '');
		const jwks = getJwks(jwksUrl);
		const { payload } = await jwtVerify(token, jwks, { audience, issuer });
		event.locals.user = {
			email: typeof payload.email === 'string' ? payload.email : undefined,
			sub: typeof payload.sub === 'string' ? payload.sub : undefined
		};
		return resolve(event);
	} catch (err) {
		console.error('Access JWT verification failed', err);
		throw error(401, 'Unauthorized');
	}
};
