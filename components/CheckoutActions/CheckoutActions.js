/* eslint-disable react/no-multi-comp */
import React, { Fragment, Component } from "react";
import PropTypes from "prop-types";
import { isEqual } from "lodash";
import styled from "styled-components";
import Actions from "components/Actions";
import ShippingAddressCheckoutAction from "@reactioncommerce/components/ShippingAddressCheckoutAction/v1";
import FulfillmentOptionsCheckoutAction from "@reactioncommerce/components/FulfillmentOptionsCheckoutAction/v1";
import PaymentsCheckoutAction from "@reactioncommerce/components/PaymentsCheckoutAction/v1";
import FinalReviewCheckoutAction from "@reactioncommerce/components/FinalReviewCheckoutAction/v1";
import { addTypographyStyles } from "@reactioncommerce/components/utils";
import withAddressValidation from "containers/address/withAddressValidation";
import Dialog from "@material-ui/core/Dialog";
import PageLoading from "components/PageLoading";
import Router from "translations/i18nRouter";
import calculateRemainderDue from "lib/utils/calculateRemainderDue";
import { placeOrderMutation } from "../../hooks/orders/placeOrder.gql";
import FulfillmentTypeAction from "components/FulfillmentTypeAction";
import deliveryMethods from "custom/deliveryMethods";
import paymentMethods_ from "custom/paymentMethods";
import PaymentMethodCheckoutAction from "components/PaymentMethodCheckoutAction";

const MessageDiv = styled.div`
  ${addTypographyStyles("NoPaymentMethodsMessage", "bodyText")}
`;

const NoPaymentMethodsMessage = () => <MessageDiv>No payment methods available</MessageDiv>;

NoPaymentMethodsMessage.renderComplete = () => "";

class CheckoutActions extends Component {
  static propTypes = {
    addressValidation: PropTypes.func.isRequired,
    addressValidationResults: PropTypes.object,
    apolloClient: PropTypes.shape({
      mutate: PropTypes.func.isRequired
    }),
    cart: PropTypes.shape({
      account: PropTypes.object,
      checkout: PropTypes.object,
      email: PropTypes.string,
      items: PropTypes.array
    }).isRequired,
    cartStore: PropTypes.object,
    checkoutMutations: PropTypes.shape({
      onSetFulfillmentOption: PropTypes.func.isRequired,
      onSetShippingAddress: PropTypes.func.isRequired
    }),
    clearAuthenticatedUsersCart: PropTypes.func.isRequired,
    orderEmailAddress: PropTypes.string.isRequired,
    paymentMethods: PropTypes.array
  };

  state = {
    actionAlerts: {
      1: null,
      2: null,
      3: null,
      4: null
    },
    hasPaymentError: false,
    isPlacingOrder: false,    
  };
  setPaymentInputs = (inputs) => {
		this.setState(prev => ({
			paymentInputs: {
				...prev.paymentInputs,
				...inputs
			}
		}));
	}

  componentDidUpdate({ addressValidationResults: prevAddressValidationResults }) {
    const { addressValidationResults } = this.props;
    if (
      addressValidationResults &&
      prevAddressValidationResults &&
      !isEqual(addressValidationResults, prevAddressValidationResults)
    ) {
      this.handleValidationErrors();
    }
  }

  // setShippingMethod = async (shippingMethod) => {
	// 	const { checkoutMutations: { onSetFulfillmentOption } } = this.props;
	// 	const { checkout: { fulfillmentGroups } } = this.props.cart;
	// 	const fulfillmentOption = {
	// 		fulfillmentGroupId: fulfillmentGroups[0]._id,
	// 		fulfillmentMethodId: shippingMethod.selectedFulfillmentOption.fulfillmentMethod._id
	// 	};

	// 	await onSetFulfillmentOption(fulfillmentOption);
	// };


  setFulfillmentType = async (type) => {
    console.log('type');
		const { checkoutMutations: { onSetFulfillmentType } } = this.props;
		const { checkout: { fulfillmentGroups } } = this.props.cart;
    console.log(fulfillmentTypeInput);
    console.log(onSetFulfillmentType);
		const fulfillmentTypeInput = {
			fulfillmentGroupId: fulfillmentGroups[0]._id,
			fulfillmentType: type
		};
		await onSetFulfillmentType(fulfillmentTypeInput);
	};

  setShippingAddress = async (address) => {
		const { checkoutMutations: { onSetShippingAddress } } = this.props;
		delete address.isValid;
		const { data, error } = await onSetShippingAddress(address);

		if (data && !error && this._isMounted) {
			this.setState({
				actionAlerts: {
					1: {}
				}
			});
		}
	};

  setPickupDetails = async (details) => {
		const { checkoutMutations: { onSetPickupDetails } } = this.props;

		const { data, error } = await onSetPickupDetails(details);

		if (data && !error && this._isMounted) {
			this.setState({
				actionAlerts: {
					1: {}
				}
			});
		}
	};


  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  buildData = ({ step, action }) => ({
    action,
    payment_method: this.paymentMethod, // eslint-disable-line camelcase
    shipping_method: this.shippingMethod, // eslint-disable-line camelcase
    step
  });

  get shippingMethod() {
    const { checkout: { fulfillmentGroups } } = this.props.cart;
    const { selectedFulfillmentOption } = fulfillmentGroups[0];
    return selectedFulfillmentOption ? selectedFulfillmentOption.fulfillmentMethod.displayName : null;
  }

  get paymentMethod() {
    const [firstPayment] = this.props.cartStore.checkoutPayments;
    return firstPayment ? firstPayment.payment.method : null;
  }


  handleValidationErrors() {
    const { addressValidationResults } = this.props;
    const { validationErrors } = addressValidationResults || [];
    const shippingAlert =
      validationErrors && validationErrors.length ? {
        alertType: validationErrors[0].type,
        title: validationErrors[0].summary,
        message: validationErrors[0].details
      } : null;
    this.setState({ actionAlerts: { 1: shippingAlert } });
  }

  setShippingMethod = async (shippingMethod) => {
    const { checkoutMutations: { onSetFulfillmentOption } } = this.props;
    const { checkout: { fulfillmentGroups } } = this.props.cart;
    const fulfillmentOption = {
      fulfillmentGroupId: fulfillmentGroups[0]._id,
      fulfillmentMethodId: shippingMethod.selectedFulfillmentOption.fulfillmentMethod._id
    };

    await onSetFulfillmentOption(fulfillmentOption);
  };

  handlePaymentSubmit = (paymentInput) => {
    this.props.cartStore.addCheckoutPayment(paymentInput);

    this.setState({
      hasPaymentError: false,
      actionAlerts: {
        3: {}
      }
    });
  };

  handlePaymentsReset = () => {
    this.props.cartStore.resetCheckoutPayments();
  }

  buildOrder = async () => {
    const { cart, cartStore, orderEmailAddress } = this.props;
    const cartId = cartStore.hasAccountCart ? cartStore.accountCartId : cartStore.anonymousCartId;
    const { checkout } = cart;

    const fulfillmentGroups = checkout.fulfillmentGroups.map((group) => {
      const { data } = group;
      const { selectedFulfillmentOption } = group;

      const items = cart.items.map((item) => ({
        addedAt: item.addedAt,
        price: item.price.amount,
        productConfiguration: item.productConfiguration,
        quantity: item.quantity
      }));

      return {
        data,
        items,
        selectedFulfillmentMethodId: selectedFulfillmentOption.fulfillmentMethod._id,
        shopId: group.shop._id,
        totalPrice: checkout.summary.total.amount,
        type: group.type
      };
    });

    const order = {
      cartId,
      currencyCode: checkout.summary.total.currency.code,
      email: orderEmailAddress,
      fulfillmentGroups,
      shopId: cart.shop._id
    };

    return this.setState({ isPlacingOrder: true }, () => this.placeOrder(order));
  };

  placeOrder = async (order) => {
    const { cartStore, clearAuthenticatedUsersCart, apolloClient } = this.props;

    // Payments can have `null` amount to mean "remaining".
    let remainingAmountDue = order.fulfillmentGroups.reduce((sum, group) => sum + group.totalPrice, 0);
    const payments = cartStore.checkoutPayments.map(({ payment }) => {
      const amount = payment.amount ? Math.min(payment.amount, remainingAmountDue) : remainingAmountDue;
      remainingAmountDue -= amount;
      return { ...payment, amount };
    });

    try {
      const { data } = await apolloClient.mutate({
        mutation: placeOrderMutation,
        variables: {
          input: {
            order,
            payments
          }
        }
      });

      // Placing the order was successful, so we should clear the
      // anonymous cart credentials from cookie since it will be
      // deleted on the server.
      cartStore.clearAnonymousCartCredentials();
      clearAuthenticatedUsersCart();

      // Also destroy the collected and cached payment input
      cartStore.resetCheckoutPayments();

      const { placeOrder: { orders, token } } = data;

      // Send user to order confirmation page
      Router.push(`/checkout/order?orderId=${orders[0].referenceId}${token ? `&token=${token}` : ""}`);
    } catch (error) {
      if (this._isMounted) {
        this.setState({
          hasPaymentError: true,
          isPlacingOrder: false,
          actionAlerts: {
            3: {
              alertType: "error",
              title: "Payment method failed",
              message: error.toString().replace("Error: GraphQL error:", "")
            }
          }
        });
      }
    }
  };

  renderPlacingOrderOverlay = () => {
    const { isPlacingOrder } = this.state;

    return (
      <Dialog fullScreen disableBackdropClick={true} disableEscapeKeyDown={true} open={isPlacingOrder}>
        <PageLoading delay={0} message="Placing your order..." />
      </Dialog>
    );
  };

  render() {
    const {
      addressValidation,
      addressValidationResults,
      cart,
      cartStore,
      paymentMethods
    } = this.props;

    const { checkout: { fulfillmentGroups, summary }, items } = cart;
    const { actionAlerts, hasPaymentError } = this.state;
    const [fulfillmentGroup] = fulfillmentGroups;

    // Order summary
    const { fulfillmentTotal, itemTotal, surchargeTotal, taxTotal, total } = summary;
    const checkoutSummary = {
      displayShipping: fulfillmentTotal && fulfillmentTotal.displayAmount,
      displaySubtotal: itemTotal.displayAmount,
      displaySurcharge: surchargeTotal.displayAmount,
      displayTotal: total.displayAmount,
      displayTax: taxTotal && taxTotal.displayAmount,
      items
    };

    const addresses = fulfillmentGroups.reduce((list, group) => {
      if (group.shippingAddress) list.push(group.shippingAddress);
      return list;
    }, []);

    const payments = cartStore.checkoutPayments.slice();
    const remainingAmountDue = calculateRemainderDue(payments, total.amount);

    let PaymentComponent = PaymentsCheckoutAction;
    if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
      console.log("empty payment methods");
      PaymentComponent = NoPaymentMethodsMessage;
    }

    const actions = [
      {
				id: "1",
				activeLabel: "Elige un método de entrega",
				completeLabel: "Método de entrega",
				incompleteLabel: "Método de entrega",
				status: fulfillmentGroup.type !== "shipping" || fulfillmentGroup.shippingAddress ? "complete" : "incomplete",
				component: FulfillmentTypeAction,
				onSubmit: this.setShippingAddress,
				props: {
					alert: actionAlerts["1"],
					deliveryMethods,
					fulfillmentGroup,
					actionAlerts: {
						"2": actionAlerts["2"],
						"3": actionAlerts["3"],
					},
					submits: {
						onSubmitShippingAddress: this.setShippingAddress,
						// onSetShippingMethod: this.setShippingMethod,
						onSelectFulfillmentType: this.setFulfillmentType,
						onSubmitPickupDetails: this.setPickupDetails
					}
				}
			},
      {
        id: "3",
        activeLabel: "Elige cómo pagarás tu orden",
        completeLabel: "Payment information",
        incompleteLabel: "Payment information",
        status: remainingAmountDue === 0 && !hasPaymentError ? "complete" : "incomplete",
        component: PaymentMethodCheckoutAction,
        onSubmit: this.handlePaymentSubmit,
        props: {
          addresses,
          alert: actionAlerts["3"],
          onReset: this.handlePaymentsReset,
          payments,
          paymentMethods,
          remainingAmountDue,          
					onChange: this.setPaymentInputs,
          //onChange: (value) => console.log(value)
        }
      },
    ];
    return (
      <Fragment>
        {this.renderPlacingOrderOverlay()}
        <Actions actions={actions} />
      </Fragment>
    );
  }
}

export default withAddressValidation(CheckoutActions);