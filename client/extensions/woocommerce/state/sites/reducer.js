/**
 * Internal dependencies
 */
import { combineReducers, keyedReducer } from 'state/utils';
import locations from './locations/reducer';
import orders from './orders/reducer';
import paymentMethods from './payment-methods/reducer';
import productCategories from './product-categories/reducer';
import products from './products/reducer';
import shippingMethods from './shipping-methods/reducer';
import shippingZoneMethods from './shipping-zone-methods/reducer';
import shippingZones from './shipping-zones/reducer';
import settings from './settings/reducer';
import status from './status/reducer';

const reducer = combineReducers( {
	locations,
	orders,
	paymentMethods,
	productCategories,
	products,
	settings,
	shippingMethods,
	shippingZoneMethods,
	shippingZones,
	status,
} );

export default keyedReducer( 'siteId', reducer );
