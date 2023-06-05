import * as ort from 'onnxruntime-web'
import ndarray from 'ndarray'
import ops from 'ndarray-ops'
import pify from 'pify'

const getPixels = pify(require('get-pixels'))
const savePixels = require('save-pixels')
const usr = require('ua-parser-js')

let session = null

export async function initialize(setProgress) {
  ort.env.wasm = { simd: true, proxy: true }
  const ua = usr(navigator.userAgent)
  ort.env.wasm.numThreads = ua.engine.name == 'WebKit' ? 1 : Math.min(navigator.hardwareConcurrency / 2, 16)
  setProgress(0)
  
  if (!session) {
    const response = await fetch('./models/superRes.onnx')
    const reader = response.body.getReader()
    const length = parseInt(response.headers.get('content-length'))
    const data = new Uint8Array(length)
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) { break }
      data.set(value, received)
      received += value.length
      setProgress(0.7 * (received / length))
    }

    session = await ort.InferenceSession.create(data.buffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: 'sequential'
    })

    setProgress(1)
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

export async function upscale(uri, upscaleFactor) {
  const CHUNK_SIZE = 1024, PAD_SIZE = 32
  let pixels = await getPixels(uri)

  for (let s = 0; s < upscaleFactor; s++) {
    const [inImgW, inImgH] = pixels.shape
    const [outImgW, outImgH] = [inImgW * 2, inImgH * 2]
    const [nChunksW, nChunksH] = [Math.ceil(inImgW / CHUNK_SIZE), Math.ceil(inImgH / CHUNK_SIZE)]
    const [chunkW, chunkH] = [Math.floor(inImgW / nChunksW), Math.floor(inImgH / nChunksH)]

    const outArr = ndarray(new Uint8Array(outImgW * outImgH * 4), [outImgW, outImgH, 4])

    for (let i = 0; i < nChunksH; i++) {
      for (let j = 0; j < nChunksW; j++) {
        const x = j * chunkW, y = i * chunkH
        const yStart = Math.max(0, y - PAD_SIZE), xStart = Math.max(0, x - PAD_SIZE)
        const inH = Math.min(inImgH, yStart + chunkH + PAD_SIZE * 2), inW = Math.min(inImgW, xStart + chunkW + PAD_SIZE * 2)
        const outH = 2 * (inH - y), outW = 2 * (inW - x)

        const inSlice = pixels.lo(xStart, yStart, 0).hi(inW, inH, 4)
        const subArr = ndarray(new Uint8Array(inW * inH * 4), inSlice.shape)
        ops.assign(subArr, inSlice)

        let tensor = new ort.Tensor('uint8', subArr.data.slice(), [inW, inH, 4])
        let sr
        try { sr = (await session.run({ input: tensor })).output } 
        catch (e) { console.log('Failed to run super resolution\n', e) }

        const chunkArr = ndarray(sr.data, sr.dims)
        const chunkSlice = chunkArr.lo((x - xStart) * 2, (y - yStart) * 2, 0).hi(outW, outH, 4)
        const outSlice = outArr.lo(x * 2, y * 2, 0).hi(outW, outH, 4)
        ops.assign(outSlice, chunkSlice)
      }
    }

    pixels = outArr
  }

  return savePixels(pixels, 'canvas').toDataURL('image/png')
}
