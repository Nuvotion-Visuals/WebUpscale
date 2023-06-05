import './globals.css'

import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>WebUpscale</title>
        <meta
          name="description"
          content="Free unlimited image upscaling in your browser using AI."
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
