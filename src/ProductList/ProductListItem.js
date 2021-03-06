import React from 'react';
import { Link } from 'react-router-dom';

import { baseImgUrl } from '../../config';

const ProductItem = props => {
  const item = props.item;

  if (!item) {
    return null;
  }

  const item_link = '/item/' + item._id;
  const img_url = baseImgUrl + item.img_url;

  return (
    <React.Fragment>
      <div className="row">
        <div className="col-md-7">
          <Link to={item_link}>
            {item.img_url && (
              <img className="img-responsive product" src={img_url} alt="" />
            )}
          </Link>
        </div>
        <div className="col-md-5">
          <h3>
            <Link to={item_link}>{item.title && item.title}</Link>
          </h3>
          <h4>{item.slogan && item.slogan}</h4>
          <p>{item.description && item.description}</p>
          <Link className="btn btn-primary" to={item_link}>
            View Product
            <span className="glyphicon glyphicon-chevron-right" />
          </Link>
        </div>
      </div>
      <hr />
    </React.Fragment>
  );
};

export default ProductItem;
