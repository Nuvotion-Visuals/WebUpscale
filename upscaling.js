import * as ort from 'onnxruntime-web'

import ndarray from 'ndarray'
import ops from 'ndarray-ops'

let superSession = null

import pify from 'pify'

const getPixels = pify(require('get-pixels'))
const savePixels = require('save-pixels')
const usr = require('ua-parser-js')

export async function upScaleFromURI(uri, upscaleFactor) {
  let pixels = await getPixels(uri)
  return await multiUpscale(pixels, upscaleFactor)
}

function imageNDarrayToDataURI(data, outputType) {
  const canvas = savePixels(data, 'canvas')
  if (outputType == 'canvas') {
    return canvas
  }

  return canvas.toDataURL(outputType)
}

function prepareImage(imageArray, model) {
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

async function fetchModel(filepathOrUri, setProgress, startProgress, endProgress) {
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

  await new Promise((resolve) => setTimeout(resolve, 300))
}

export async function runSuperRes(imageArray) {
  const feeds = prepareImage(imageArray, 'superRes')

  let sr
  try {
    const output = await superSession.run(feeds)
    sr = output.output
  } catch (e) {
    console.log('Failed to run super resolution')
    console.log(e)
  }
  return sr
}

export async function initializeSuperRes(setProgress) {
  console.debug('Initializing super resolution')
  if (superSession !== null) {
    return
  }

  const superBuf = await fetchModel('./models/superRes.onnx', setProgress, 0.5, 0.9)
  superSession = await ort.InferenceSession.create(superBuf, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
    enableCpuMemArena: true,
    enableMemPattern: true,
    executionMode: 'sequential'
  })
}


export async function multiUpscale(imageArray, upscaleFactor, outputType = 'image/png') {
  let outArr = imageArray
  for (let s = 0; s < upscaleFactor; s += 1) {
    outArr = await upscaleFrame(outArr)
  }
  return imageNDarrayToDataURI(outArr, outputType)
}

async function upscaleFrame(imageArray) {
  const CHUNK_SIZE = 1024
  const PAD_SIZE = 32

  const inImgW = imageArray.shape[0]
  const inImgH = imageArray.shape[1]
  const outImgW = inImgW * 2
  const outImgH = inImgH * 2
  const nChunksW = Math.ceil(inImgW / CHUNK_SIZE)
  const nChunksH = Math.ceil(inImgH / CHUNK_SIZE)
  const chunkW = Math.floor(inImgW / nChunksW)
  const chunkH = Math.floor(inImgH / nChunksH)

  // Split the image in chunks and run super resolution on each chunk
  const outArr = ndarray(new Uint8Array(outImgW * outImgH * 4), [outImgW, outImgH, 4])
  for (let i = 0; i < nChunksH; i += 1) {
    for (let j = 0; j < nChunksW; j += 1) {
      const x = j * chunkW
      const y = i * chunkH

      // Compute chunk bounds including padding
      const yStart = Math.max(0, y - PAD_SIZE)
      const inH = yStart + chunkH + PAD_SIZE * 2 > inImgH ? inImgH - yStart : chunkH + PAD_SIZE * 2
      const outH = 2 * (Math.min(inImgH, y + chunkH) - y)
      const xStart = Math.max(0, x - PAD_SIZE)
      const inW = xStart + chunkW + PAD_SIZE * 2 > inImgW ? inImgW - xStart : chunkW + PAD_SIZE * 2
      const outW = 2 * (Math.min(inImgW, x + chunkW) - x)

      // Create sliced and copy
      const inSlice = imageArray.lo(xStart, yStart, 0).hi(inW, inH, 4)
      const subArr = ndarray(new Uint8Array(inW * inH * 4), inSlice.shape)
      ops.assign(subArr, inSlice)

      // Run the super resolution model on the chunk, copy the result into the combined array
      const chunkData = await runSuperRes(subArr)
      const chunkArr = ndarray(chunkData.data, chunkData.dims)
      const chunkSlice = chunkArr.lo((x - xStart) * 2, (y - yStart) * 2, 0).hi(outW, outH, 4)
      const outSlice = outArr.lo(x * 2, y * 2, 0).hi(outW, outH, 4)
      ops.assign(outSlice, chunkSlice)
    }
  }

  return outArr
}