import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const audience = process.env.CLOUDFLARE_ACCESS_AUD;
const jwksUrl = process.env.CLOUDFLARE_ACCESS_JWKS_URL;

if (!audience || !jwksUrl) {
	throw new Error('CLOUDFLARE_ACCESS_AUD and CLOUDFLARE_ACCESS_JWKS_URL must be set');
}

const issuer = jwksUrl.replace('/cdn-cgi/access/certs', '');
const jwks = createRemoteJWKSet(new URL(jwksUrl));

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.request.headers.get('cf-access-jwt-assertion');
	if (!token) throw error(401, 'Unauthorized');

	try {
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
