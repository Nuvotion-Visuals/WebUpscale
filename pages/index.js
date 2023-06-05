import { useAppStateStore, useImageStore } from '@/services/useState'
import { useEffect } from 'react'
import { useWindowSize } from '@/services/windowUtilities'
import { initializeONNX, upScaleFromURI } from '@/services/inference/utils'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'
import { downloadImage } from '@/services/imageUtilities'
import { setDataURIFromFile } from '@/services/imageUtilities'

const ImageDisplay = () => {
  const { inputURI, outputURI } = useImageStore()

  return (
    <div id="image-display-container">
      {outputURI == null ? (
        <Image src={inputURI} width="1" height="1" id="stock-image" priority={true} alt="Before image" />
      ) : (
        <ReactCompareSlider
          position={50}
          itemOne={
            <Image width="500" height="500" src={inputURI} id="before-image" priority={true} alt="Before image" />
          }
          itemTwo={
            <Image width="500" height="500" src={outputURI} id="after-image" priority={true} alt="After image" />
          }
        />
      )}
    </div>
  )
}

export function DownloadComponent() {
  const { fileName, extension, outputURI, hasntRun } = useImageStore()

  return (
    <button onClick={() => downloadImage(fileName, extension, outputURI)} disabled={hasntRun}>
      <span>Download</span>
    </button>
  )
}

export function UploadButtonComponent() {
  const { setTempFileName, setInputURI } = useImageStore()
  const setSelectedPreset = useAppStateStore((state) => state.setSelectedPreset)

  return (
    <div>
      <button id="upload-button" type="button">
        <label>
          <input
            type="file"
            onInput={(e) => {
              if (e.target.files[0]) {
                setDataURIFromFile(e.target.files[0], setInputURI)
                setTempFileName(e.target.files[0].name.split('.')[0])
                setSelectedPreset('')
              }
            }}
            onChange={(e) => {
              if (e.target.files[0]) {
                setDataURIFromFile(e.target.files[0], setInputURI)
                setTempFileName(e.target.files[0].name.split('.')[0])
                setSelectedPreset('')
              }
            }}
            onClick={(e) => {
              e.target.value = null
            }}
          />
        </label>
        Upload
      </button>
    </div>
  )
}

const RunComponent = () => {
  const { setOutputURI, setUpscaleFactor, setTags, inputURI, extension, upscaleFactor } = useImageStore()
  const { setDownloadReady, setRunning, setErrorMessage, setLoadProg, running, loadProg } = useAppStateStore()

  const modelLoading = loadProg >= 0

  return (
    <button disabled={modelLoading || running} onClick={() => {
        setLoadProg(0)
        initializeONNX(setLoadProg)
          .then(() => {
            setRunning(true)
          })
          .then(() => {
            upScaleFromURI(extension, setTags, inputURI, upscaleFactor)
              .then((result) => {
                setOutputURI(result)
              })
              .catch((error) => {
                setErrorMessage(error)
              })
              .finally(() => {
                setDownloadReady(true)
                setRunning(false)
                setUpscaleFactor(2)
              })
          })
          .catch(() => {
            setErrorMessage('Could not load model.')
          })
          .finally(() => {
            setLoadProg(-1)
          })
      }}
    >
      {modelLoading && (
        <div id="upscale-button-bg" style={{ width: `${loadProg * 100}%`, zIndex: -1, transitionProperty: 'width' }}/>
      )}

      {running ? (
        <span> Upscaling... </span>
      ) : !modelLoading ? (
        <span> Upscale </span>
      ) : (
        <span> Loading Model </span>
      )}
    </button>
  )
}

function UpscaleFactorComponent() {
  const setUpscaleFactor = useImageStore((state) => state.setUpscaleFactor)
  const running = useAppStateStore((state) => state.running)

  return (
    <select
      id="resolution-select"
      onInput={(inp) => {
        setUpscaleFactor(parseInt(inp.target.value))
      }}
      disabled={running}
    >
      <option value="2">2&#215;</option>
      <option value="4">4&#215;</option>
      <option value="8">8&#215;</option>
    </select>
  )
}

export default function Main() {
  const size = useWindowSize()
  const setMobile = useAppStateStore((state) => state.setMobile)
  const outputURI = useImageStore((state) => state.outputURI)

  useEffect(() => {
    setMobile(size.width / size.height < 1.0)
  }, [size])

  return (
    <div>
      <div></div>
      <div>
        <ImageDisplay />
      </div>
      {outputURI != null ? (
        <div>
          <UploadButtonComponent />
          <DownloadComponent />
        </div>
      ) : (
        <div>
          <RunComponent />
          <UpscaleFactorComponent />
        </div>
      )}
    </div>
  )
}
