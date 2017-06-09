/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import {
	includes,
	intersection,
} from 'lodash';
import page from 'page';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import EmptyContent from 'components/empty-content';
import EmailedLoginLinkExpired from './emailed-login-link-expired';
import config from 'config';
import { localize } from 'i18n-calypso';
import { LINK_EXPIRED_PAGE } from 'state/login/magic-login/constants';
import {
	fetchMagicLoginAuthenticate,
	showMagicLoginLinkExpiredPage,
} from 'state/login/magic-login/actions';
import {
	getMagicLoginCurrentView,
	getMagicLoginRequestAuthError,
	getMagicLoginRequestedAuthSuccessfully,
	isFetchingMagicLoginAuth,
} from 'state/selectors';
import {
	getTwoFactorNotificationSent,
	getTwoFactorSupportedAuthTypes,
	isTwoFactorEnabled,
} from 'state/login/selectors';
import { getCurrentUser } from 'state/current-user/selectors';

const { PropTypes } = React;
const debug = debugFactory( 'calypso:magic-login' );

const ALLOWED_SECOND_FACTORS = [
	'authenticator',
	'sms',
];

class HandleEmailedLinkForm extends React.Component {
	static propTypes = {
		// Passed props
		clientId: PropTypes.string.isRequired,
		emailAddress: PropTypes.string.isRequired,
		token: PropTypes.string.isRequired,
		tokenTime: PropTypes.string.isRequired,

		// Connected props
		authError: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.number,
		] ),
		currentUser: PropTypes.object,
		isAuthenticated: PropTypes.bool,
		isExpired: PropTypes.bool,
		isFetching: PropTypes.bool,
		isTwoFactor: PropTypes.bool,
		twoFactorAuthTypes: PropTypes.array,
		twoFactorNotificationSent: PropTypes.bool,

		// Conntected action creators
		fetchMagicLoginAuthenticate: PropTypes.func.isRequired,
		showMagicLoginLinkExpiredPage: PropTypes.func.isRequired,
	};

	state = {
		hasSubmitted: false,
	};

	handleSubmit = event => {
		event.preventDefault();

		this.setState( {
			hasSubmitted: true,
		} );

		this.props.fetchMagicLoginAuthenticate( this.props.emailAddress, this.props.token, this.props.tokenTime );
	};

	componentWillUpdate( nextProps, nextState ) {
		const {
			isAuthenticated,
			isFetching,
			isTwoFactor,
			twoFactorAuthTypes,
			twoFactorNotificationSent,
		} = nextProps;

		if ( ! nextState.hasSubmitted || isFetching ) {
			// Don't do anything here unless the browser has received the `POST` response
			// console.log('bailing early');
			return;
		}
		// console.log('submitted & not fetching', {nextProps});

		if ( nextProps.authError || ! isAuthenticated ) {
			// @TODO if this is a 5XX, or timeout, show an error...?
			this.props.showMagicLoginLinkExpiredPage();
			return;
		}

		if ( ! isTwoFactor ) {
			debug( 'no 2 factor detected -- redirecting' );
			// @TODO avoid full reload
			window.location.replace( '/' );
		}

		let authType;
		const filteredAuthTypes = intersection( ALLOWED_SECOND_FACTORS, twoFactorAuthTypes );

		for ( let i = 0; i < filteredAuthTypes.length; i++ ) {
			if ( twoFactorNotificationSent && twoFactorNotificationSent === filteredAuthTypes[ i ] ) {
				authType = twoFactorNotificationSent;
			}
		}
		if ( includes( filteredAuthTypes, 'authenticator' ) ) {
			authType = 'authenticator';
		}

		if ( ! authType ) {
			this.props.showMagicLoginLinkExpiredPage();
			return;
		}

// @todo fix "empty_two_step_nonce" error
		page( '/log-in/' + authType );
		return;
	}

	render() {
		const {
			currentUser,
			emailAddress,
			isExpired,
			isFetching,
			translate,
		} = this.props;

		if ( isExpired ) {
			return <EmailedLoginLinkExpired />;
		}

		const action = (
			<Button primary disabled={ this.state.hasSubmitted } onClick={ this.handleSubmit }>
				{ translate( 'Finish Login' ) }
			</Button>
		);
		const title =
			this.props.clientId === config( 'wpcom_signup_id' )
				? translate( 'Continue to WordPress.com' )
				: translate( 'Continue to WordPress.com on your WordPress app' );
		const line = [
			translate(
				'Logging in as %(emailAddress)s', {
					args: {
						emailAddress,
					}
				}
			)
		];

		if ( currentUser && currentUser.username ) {
			line.push( <p>{
				translate( 'NOTE: You are already logged in as user: %(user)s', {
					args: {
						user: currentUser.username,
					}
				} ) }<br />
				{ translate( 'Continuing will switch users.' ) }
				</p> );
		}

		return (
			<EmptyContent
				action={ action }
				className={ classNames( {
					'magic-login__handle-link': true,
					'magic-login__is-fetching-auth': isFetching,
				} ) }
				illustration={ '/calypso/images/illustrations/illustration-nosites.svg' }
				illustrationWidth={ 500 }
				line={ line }
				title={ title }
				/>
		);
	}
}

const mapState = state => {
	return {
		authError: getMagicLoginRequestAuthError( state ),
		currentUser: getCurrentUser( state ),
		isAuthenticated: getMagicLoginRequestedAuthSuccessfully( state ),
		isExpired: getMagicLoginCurrentView( state ) === LINK_EXPIRED_PAGE,
		isFetching: isFetchingMagicLoginAuth( state ),
		isTwoFactor: isTwoFactorEnabled( state ),
		twoFactorAuthTypes: getTwoFactorSupportedAuthTypes( state ) || [],
		twoFactorNotificationSent: getTwoFactorNotificationSent( state ),
	};
};

const mapDispatch = {
	fetchMagicLoginAuthenticate,
	showMagicLoginLinkExpiredPage,
};

export default connect( mapState, mapDispatch )( localize( HandleEmailedLinkForm ) );
