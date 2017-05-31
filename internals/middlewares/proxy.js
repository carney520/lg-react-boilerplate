/*
 * 代理中间件
 */
const chalk = require('chalk')
const url = require('url')
const httpProxyMiddleware = require('http-proxy-middleware')

export type ProxyOptions = {
  path?: RegExp | string,
  context?: string | Array<string> | Function,
  options: {
    target: string | { host: string, port: number, protocol: string },
    logLevel: string,
    ws: boolean,
    secure: boolean,
    xfwd: boolean,
    [option]: any,
  }
}

function onProxyError (options: ProxyOptions) {
  return (err, req, res) => {
    const host = req.headers && req.headers.host;
    const target = JSON.stringify(options.options.target)
    console.log(
`${chalk.red('[Proxy error]')}: Could not proxy request ${chalk.cyan(req.url)}
 from ${chalk.cyan(host)} to ${chalk.cyan(target)}.
 Error Code: ${chalk.cyan(err.code)}.
`
    )
    // And immediately send the proper error response to the client.
    // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
    if (res.writeHead && !res.headersSent) {
      res.writeHead(500);
    }
    res.end(`[Proxy error]: Could not proxy request ${req.url} from ${host} to ${target} (${err.code}).`)
  }
}

module.exports = function setupProxy (app, options: ProxyOptions) {
  // 🚧 下面情况排除代理:
  // - /index.html (served as HTML5 history API fallback)
  // - /*.hot-update.json (WebpackDevServer uses this too for hot reloading)
  // - /sockjs-node/* (WebpackDevServer uses this for hot reloading)
  // Tip: use https://jex.im/regulex/ to visualize the regex
  const mayProxy = /^(?!\/(index\.html$|.*\.hot-update\.json$|sockjs-node\/)).*$/;
  const orgTarget = options.options.target
  const target = typeof orgTarget === 'string' ? url.parse(orgTarget) : orgTarget

  options = { // eslint-disable-line no-param-reassign
    context: pathname => mayProxy.test(pathname),
    ...options,
    options: {
      logLevel: 'silent',
      onError: onProxyError(options),
      secure: false,
      changeOrigin: true,
      ws: true,
      xfwd: true,
      onProxyReq (proxyReq) {
        // Browers may send Origin headers even with same-origin
        // requests. To prevent CORS issues, we have to change
        // the Origin to match the target URL.
        if (proxyReq.getHeader('origin')) {
          proxyReq.setHeader('origin', target.host);
        }
      },
      ...options.options,
      target,
    },
  }

  const hpm = httpProxyMiddleware(options.context, options.options)
  const from = options.path || (typeof options.context === 'function' ? 'Unknown' : options.context)
  console.log(
    `${chalk.green('[Proxy]')}: ${from} ${chalk.blue('->')} ${JSON.stringify(orgTarget)}`
  )
  const path = options.path instanceof RegExp ? options.path : RegExp(options.path)
  app.use(path, hpm);
}
