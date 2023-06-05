import 'tailwindcss/tailwind.css'
import './globals.css'

import Head from 'next/head'
import { registerEventHandlers } from '@/services/windowUtilities'

function MyApp({ Component, pageProps }) {
  registerEventHandlers()

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
