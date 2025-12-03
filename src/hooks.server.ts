import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);

    // Anti-AI Headers
    response.headers.set('X-Robots-Tag', 'noai, noimageai');

    return response;
};
