/**
 * External dependencies
 */
import { expect } from 'chai';
import { stub } from 'sinon';

/**
 * Internal dependencies
 */
import useMockery from 'test/helpers/use-mockery';

describe( 'isEligibleForDomainToPaidPlanUpsell', () => {
	const state = 'state';
	const siteId = 'siteId';

	let canCurrentUser;
	let isMappedDomainSite;
	let isSiteOnFreePlan;
	let isEligibleForDomainToPaidPlanUpsell;

	useMockery( mockery => {
		canCurrentUser = stub();
		isMappedDomainSite = stub();
		isSiteOnFreePlan = stub();

		mockery.registerMock( 'state/selectors/can-current-user', canCurrentUser );
		mockery.registerMock( 'state/selectors/is-mapped-domain-site', isMappedDomainSite );
		mockery.registerMock( 'state/selectors/is-site-on-free-plan', isSiteOnFreePlan );
	} );

	before( () => {
		isEligibleForDomainToPaidPlanUpsell = require( '../is-eligible-for-domain-to-paid-plan-upsell' );
	} );

	const meetAllConditions = () => {
		canCurrentUser.withArgs( state, siteId, 'manage_options' ).returns( true );
		isMappedDomainSite.withArgs( state, siteId ).returns( true );
		isSiteOnFreePlan.withArgs( state, siteId ).returns( true );
	};

	it( 'should return false when user can not manage options', () => {
		meetAllConditions();
		canCurrentUser.withArgs( state, siteId, 'manage_options' ).returns( false );
		expect( isEligibleForDomainToPaidPlanUpsell( state, siteId ) ).to.be.false;
	} );

	it( 'should return false when site does not have mapped domain', () => {
		meetAllConditions();
		isMappedDomainSite.withArgs( state, siteId ).returns( false );
		expect( isEligibleForDomainToPaidPlanUpsell( state, siteId ) ).to.be.false;
	} );

	it( 'should return false when site is not on a free plan', () => {
		meetAllConditions();
		isSiteOnFreePlan.withArgs( state, siteId ).returns( false );
		expect( isEligibleForDomainToPaidPlanUpsell( state, siteId ) ).to.be.false;
	} );

	it( 'should return true when all conditions are met', () => {
		meetAllConditions();
		expect( isEligibleForDomainToPaidPlanUpsell( state, siteId ) ).to.be.true;
	} );
} );
