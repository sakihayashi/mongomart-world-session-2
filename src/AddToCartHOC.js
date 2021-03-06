import React, { Component } from 'react';
import { BSON, RemoteMongoClient } from 'mongodb-stitch-browser-sdk';

import { stitchClusterNames, dbName, collNames } from '../config';

export default class AddToCartHOC extends Component {
  constructor(props) {
    super(props);
    this.state = {
      addToCartError: undefined,
      db: props.client
        .getServiceClient(
          RemoteMongoClient.factory,
          stitchClusterNames.users
        )
        .db(dbName),
      isAddedToCart: false,
    };
    this.handleAddToCart = this.handleAddToCart.bind(this);
  }

  componentDidMount() {}

  handleAddToCart() {
    this.incrementProductQuantity();
    if (typeof this.props.doAfterAddToCart === "function" && this.props.notification) {
      this.props.doAfterAddToCart(this.props.notification);
    }
  }

  incrementProductQuantity() {
    // first try to increment quantity of item in cart,
    // if fails, add item to cart or create cart (upsert)
    const productId = this.props.productId ? this.props.productId : this.props.item._id;
    let incQuery = {
      _id: this.props.client.auth.currentUser.id,
      'cart._id': productId
    };
    const incUpdate = { $inc: { 'cart.$.quantity': 1 } };

    this.props.clientAuthenticated
      .then(() =>
        // increment quantity by one
        this.state.db.collection(collNames.users).updateOne(incQuery, incUpdate)
      )
      .then(response => {
        if (response && response.modifiedCount !== 1) {
          // if not incremented,
          // either add item to cart or create new cart (upsert)
          this.createCartOrCartItem();
        } else {
          this.onAddToCartSuccess();
        }
      })
      .catch(err => {
        this.onAddToCartError(err);
      });
  }

  async createCartOrCartItem() {
    let addQuery = { _id: this.props.client.auth.currentUser.id };
    // add flag for anonymous users so they can be cleaned up easily if needed
    if (
      this.props.client.auth.currentUser.loggedInProviderName === 'anon-user'
    ) {
      addQuery.anonymousUser = true;
    }

    const addItem = await this.getProduct(this.props.productId);
    addItem.quantity = 1;
    const addUpdate = { $addToSet: { cart: addItem } };

    const options = { upsert: true };

    this.props.clientAuthenticated
      .then(() =>
        this.state.db
          .collection(collNames.users)
          .updateOne(addQuery, addUpdate, options)
      )
      .then(() => {
        this.onAddToCartSuccess();
      })
      .catch(err => {
        this.onAddToCartError(err);
      });
  }

  getProduct(productId) {
    return this.props.item ? this.props.item : this.fetchProduct(this.props.productId);
  }

  fetchProduct(productId) {
    const db = this.props.client
      .getServiceClient(
        RemoteMongoClient.factory,
        stitchClusterNames.products
      )
      .db(dbName);

    return this.props.clientAuthenticated
      .then(() =>
        db
          .collection(collNames.item)
          .find({ _id: productId }, { limit: 1 })
          .asArray()
      )
      .then(response => {
        console.log(response);
        if (response && response[0]) {
          console.log(response[0]);
          return response[0];
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  onAddToCartSuccess() {
    this.setState({ addToCartError: null, isAddedToCart: true });
  }

  onAddToCartError(err) {
    console.log(err);
    this.setState({ addToCartError: err });
  }

  render() {
    const AddToCartComponent = this.props.addToCartComponent;
    const ErrorComponent = this.props.errorComponent;

    return (
    <React.Fragment>
        {AddToCartComponent && React.cloneElement(AddToCartComponent,
            {onAddToCart: this.handleAddToCart, isAddedToCart: this.state.isAddedToCart})
        }
        {ErrorComponent && React.cloneElement(ErrorComponent, 
            {message: 'Error while adding to cart!',error: this.state.addToCartError, display: 'small'})
        }
    </React.Fragment>
    );
  }
}
