/**
 * External Dependencies
 */
import React, { PropTypes } from 'react';
import { noop, truncate } from 'lodash';
import classnames from 'classnames';
import ReactDom from 'react-dom';
import closest from 'component-closest';

/**
 * Internal Dependencies
 */
import Card from 'components/card';
import DisplayTypes from 'state/reader/posts/display-types';
import ReaderPostActions from 'blocks/reader-post-actions';
import * as stats from 'reader/stats';
import PostByline from './byline';
import FeaturedAsset from './featured-asset';
import FollowButton from 'reader/follow-button';

export default class RefreshPostCard extends React.Component {
	static propTypes = {
		post: PropTypes.object.isRequired,
		site: PropTypes.object,
		feed: PropTypes.object,
		onClick: PropTypes.func,
		onCommentClick: PropTypes.func,
		showPrimaryFollowButton: PropTypes.bool
	};

	static defaultProps = {
		onClick: noop,
		onCommentClick: noop
	};

	propagateCardClick = () => {
		const postToOpen = this.props.post;

		// @todo
		// For Discover posts (but not site picks), open the original post in full post view
		// https://github.com/Automattic/wp-calypso/issues/8696

		this.props.onClick( { post: postToOpen, site: this.props.site, feed: this.props.feed } );
	}

	handleCardClick = ( event ) => {
		const rootNode = ReactDom.findDOMNode( this ),
			selection = window.getSelection && window.getSelection();

		// if the click has modifier or was not primary, ignore it
		if ( event.button > 0 || event.metaKey || event.controlKey || event.shiftKey || event.altKey ) {
			if ( closest( event.target, '.reader-post-card__title-link', true, rootNode ) ) {
				stats.recordPermalinkClick( 'card_title_with_modifier', this.props.post );
			}
			return;
		}

		if ( closest( event.target, '.should-scroll', true, rootNode ) ) {
			setTimeout( function() {
				window.scrollTo( 0, 0 );
			}, 100 );
		}

		// declarative ignore
		if ( closest( event.target, '.ignore-click, [rel~=external]', true, rootNode ) ) {
			return;
		}

		// ignore clicks on anchors inside inline content
		if ( closest( event.target, 'a', true, rootNode ) && closest( event.target, '.reader-post-card__excerpt', true, rootNode ) ) {
			return;
		}

		// ignore clicks when highlighting text
		if ( selection && selection.toString() ) {
			return;
		}

		// programattic ignore
		if ( ! event.defaultPrevented ) { // some child handled it
			event.preventDefault();
			this.propagateCardClick();
		}
	}

	render() {
		const { post, site, feed, onCommentClick, showPrimaryFollowButton } = this.props;
		const isPhotoOnly = post.display_type & DisplayTypes.PHOTO_ONLY;
		const title = truncate( post.title, {
			length: 140,
			separator: /,? +/
		} );
		const featuredAsset = ( <FeaturedAsset post={ post } /> );

		const classes = classnames( 'reader-post-card', {
			'has-thumbnail': !! featuredAsset,
			'is-photo': isPhotoOnly
		} );

		let followUrl;
		if ( showPrimaryFollowButton ) {
			followUrl = feed ? feed.feed_URL : post.site_URL;
		}

		return (
			<Card className={ classes } onClick={ this.handleCardClick }>
				<PostByline post={ post } site={ site } feed={ feed } />
				{ showPrimaryFollowButton && <FollowButton siteUrl={ followUrl } /> }
				<div className="reader-post-card__post">
					{ featuredAsset }
					<div className="reader-post-card__post-details">
						<h1 className="reader-post-card__title">
							<a className="reader-post-card__title-link" href={ post.URL }>{ title }</a>
						</h1>
						{ ! isPhotoOnly && <div className="reader-post-card__excerpt">{ post.short_excerpt }</div> }
						{ post &&
							<ReaderPostActions
								post={ post }
								showVisit={ true }
								showMenu={ true }
								onCommentClick={ onCommentClick }
								showEdit={ false }
								className="ignore-click"
								iconSize={ 18 } />
						}
					</div>
				</div>
				{ this.props.children }
			</Card>
		);
	}
}
