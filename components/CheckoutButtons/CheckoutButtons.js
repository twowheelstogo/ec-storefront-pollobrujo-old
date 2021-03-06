import React, { Component } from "react";
import PropTypes from "prop-types";
// import Button from "@reactioncommerce/components/Button/v1";
import Router from "translations/i18nRouter";
import { Button } from "@material-ui/core";
import styled from "styled-components";
import { withStyles } from "@material-ui/core/styles";
import { addTypographyStyles, applyTheme } from "@reactioncommerce/components/utils";
import Grid from "@material-ui/core/Grid";

const Div = styled.div`
  background-color: #202124;
  width: 100%;
`;

const styles = (theme) => ({
  Button_:{
    backgroundColor: theme.palette.secondary.botones,    
    color: theme.palette.colors.BotonColor,
    borderColor: theme.palette.secondary.botones, 
    fontWeight:"800",
    fontSize:"18px"  
  }, 
  Button2_:{
    backgroundColor: "#202124",    
    color: "#FFFFFF",
    border: "1px solid #FFFFFF", 
    fontWeight:"800",
    fontSize:"18px"  
  },
})

class CheckoutButtons extends Component {
  static propTypes = {
    /**
     * Set to `true` to prevent the button from calling `onClick` when clicked
     */
    isDisabled: PropTypes.bool,
    /**
     * The NextJS route name for the primary checkout button.
     */
    primaryButtonRoute: PropTypes.string,
    /**
     * Text to display inside the button
     */
    primaryButtonText: PropTypes.string,
    /**
     * className for primary checkout button
     */
    primaryClassName: PropTypes.string
  }

  static defaultProps = {
    primaryButtonRoute: "/cart/checkout",
    primaryButtonText: "Procesar a la compra",
    secondButtonText: "Seguir comprando"
  };

  handleOnClick = () => {
    const { primaryButtonRoute } = this.props;
    Router.push(primaryButtonRoute);
  }

  handleOnClick2 = () => {
    Router.push("/");
  }

  render() {
    const {
      isDisabled,
      primaryClassName,
      primaryButtonText,
      secondButtonText,
      classes:{Button_,Button2_}
    } = this.props;
    

    return (
      <Div >
        <Div style={{paddingBottom:'10px'}}>
          <Button
            fullWidth
            className={Button2_}
            variant="contained"
            disableRipple
            onClick={this.handleOnClick2}
          >
            {secondButtonText}
          </Button>
        </Div>
        <Button
          fullWidth
          className={Button_}
          onClick={this.handleOnClick}
          variant="contained"
          disableRipple
        >
          {primaryButtonText}
        </Button>
      </Div>
    );
  }
}

export default withStyles(styles)(CheckoutButtons);