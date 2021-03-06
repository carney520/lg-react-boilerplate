import React from 'react'
import { renderToString } from 'react-dom/server'
import ReactMounter from 'lg-react-mounter'
import { Provider } from 'react-redux'
import { ThemeProvider, ServerStyleSheet } from 'styled-components'
import { RouterContext } from 'react-router'
import Helmet from 'react-helmet'
import sprite from 'svg-sprite-loader/runtime/sprite.build'
import LanguageProvider from 'containers/LanguageProvider'
import createDocument from './createDocument'
import { translationMessages } from '../i18n'
import theme from '../theme'
import saga from '../saga'
import '../global-styles'

export default async function render(store, renderProps) {
  // collect styled-components styles
  // run root saga
  store.runSaga(saga)

  const Component = (
    <Provider store={store}>
      <LanguageProvider messages={translationMessages}>
        <ThemeProvider theme={theme}>
          <RouterContext {...renderProps} />
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  )
  // trigger all async actions
  ReactMounter.render(Component)
  // stop watch ACTIONS immediately
  store.end()

  // all async actions done
  await store.done
  // start real rendering
  const sheet = new ServerStyleSheet()
  const renderedString = renderToString(sheet.collectStyles(Component))
  const spriteContent = sprite.stringify()
  const css = sheet.getStyleTags()
  const helmet = Helmet.renderStatic()

  return createDocument({
    helmet,
    // static head tags
    head: [css],
    // before mount Node
    before: [spriteContent],
    renderedString,
    // after mount Node
    after: [
      `<script type="text/javascript">window.__INIT_STATE__ = ${JSON.stringify(
        store.getState()
      )}</script>`,
    ],
  })
}
