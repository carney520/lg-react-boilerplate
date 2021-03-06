/*
 * 首页
 * @flow
 */
import React from 'react'
import Helmet from 'react-helmet'
import { FormattedMessage } from 'react-intl'
import Icon from 'components/Icon'
import messages from './messages'
import injectHomePage from './injectHomePage'
import appleIcon from './social-apple.svg'

class HomePage extends React.PureComponent {
  // eslint-disable-line react/prefer-stateless-function
  // not async action need to trigger in children, so we omit to render children
  // speed up ReactMounter
  shouldOmitChildren = true
  render() {
    return (
      <div>
        <Helmet>
          <title>Home Page</title>
        </Helmet>
        <h1>
          <FormattedMessage {...messages.header} />
        </h1>
        <h2><Icon src={appleIcon} />Count: {this.props.count}</h2>
        <button onClick={this.props.onIncrement}>increment</button>
        <button onClick={this.props.onDecrement}>decrement</button>
      </div>
    )
  }
}

export default injectHomePage(HomePage)
