/**
 * External Dependencies
 */
import { some, forEach, startsWith, endsWith } from 'lodash';
import { iframeIsWhitelisted } from './utils';
import url from 'url';

/**
 * Internal Dependencies
 */

// hosts that we trust that don't work in a sandboxed iframe
const doesNotNeedSandbox = ( iframe ) => {
	const trustedHosts = [
		'spotify.com',
		'kickstarter.com'
	];

	const iframeHost = iframe.src && url.parse( iframe.src ).hostname.toLowerCase();

	return some( trustedHosts, function( trustedHost ) {
		return endsWith( '.' + iframeHost, '.' + trustedHost );
	} );
};

export default function makeEmbedsSecure( post, dom ) {
	if ( ! dom ) {
		throw new Error( 'this transform must be used as part of withContentDOM' );
	}

	const iframes = dom.querySelectorAll( 'iframe' );

	forEach( iframes, function( iframe ) {
		if ( ! startsWith( iframe.src, 'http' ) ) {
			iframe.parentNode.removeChild( iframe );
			return;
		}

		iframe.src = iframe.src.replace( /^http:/, 'https:' );

		if ( doesNotNeedSandbox( iframe ) ) {
			iframe.removeAttribute( 'sandbox' );
		} else if ( iframeIsWhitelisted( iframe ) ) {
			iframe.setAttribute( 'sandbox', 'allow-same-origin allow-scripts allow-popups' );
		} else {
			iframe.setAttribute( 'sandbox', '' );
		}
	} );

	if ( post.is_external || post.is_jetpack ) {
		const embeds = dom.querySelectorAll( 'embed,object' );

		forEach( embeds, function( embed ) {
			embed.parentNode.removeChild( embed );
		} );
	}

	return post;
}
