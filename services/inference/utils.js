import * as ort from 'onnxruntime-web'

import { initializeSuperRes, multiUpscale } from '@/services/inference/upscaling'

import pify from 'pify'

const getPixels = pify(require('get-pixels'))
const savePixels = require('save-pixels')
const usr = require('ua-parser-js')

export function imageNDarrayToDataURI(data, outputType) {
  const canvas = savePixels(data, 'canvas')
  if (outputType == 'canvas') {
    return canvas
  }

  return canvas.toDataURL(outputType)
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function prepareImage(imageArray, model) {
  const width = imageArray.shape[0]
  const height = imageArray.shape[1]
  if (model === 'superRes') {
    const tensor = new ort.Tensor('uint8', imageArray.data.slice(), [width, height, 4])
    return { input: tensor }
  } else {
    console.error('Invalid model type')
    throw new Error('Invalid model type')
  }
}

export async function fetchModel(filepathOrUri, setProgress, startProgress, endProgress) {
  const response = await fetch(filepathOrUri)
  const reader = response.body.getReader()
  const length = parseInt(response.headers.get('content-length'))
  const data = new Uint8Array(length)
  let received = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      setProgress(1)
      break
    } 
    else {
      data.set(value, received)
      received += value.length
      setProgress(startProgress + (received / length) * (endProgress - startProgress))
    }
  }
  return data.buffer
}

export async function initializeONNX(setProgress) {
  ort.env.wasm.simd = true
  ort.env.wasm.proxy = true

  const ua = usr(navigator.userAgent)
  if (ua.engine.name == 'WebKit') {
    ort.env.wasm.numThreads = 1
  } else {
    ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency / 2, 16)
  }

  setProgress(0)
  await initializeSuperRes(setProgress)
  setProgress(1)

  // Needed because WASM workers are created async, wait for them
  // to be ready
  await sleep(300)
}

export async function upScaleFromURI(extension, uri, upscaleFactor) {
  let pixels = await getPixels(uri)
  return await multiUpscale(pixels, upscaleFactor)
}
