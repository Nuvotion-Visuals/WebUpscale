import { useState } from 'react'
import { initialize, upscale } from 'upscale'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'

export default function Main() {
  const [inputURI, setInputURI] = useState('./images/colorful-reaction-diffusion.png')
  const [outputURI, setOutputURI] = useState('./images/colorful-reaction-diffusion_2x.png')
  const [fileName, setFileName] = useState('example')
  const [extension, setExtension] = useState('png')
  const [upscaleFactor, setUpscaleFactor] = useState(1)
  const [hasntRun, setHasntRun] = useState(true)
  const [loadProg, setLoadProg] = useState(-1)
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)

  const setInputURIHandler = (uri) => {
    setInputURI(uri)
    setOutputURI(null)
    setHasntRun(true)
    setExtension('png')
  }

  const setUpscaleFactorHandler = (newFactor) => {
    setUpscaleFactor(Math.log2(newFactor))
  }

  const setOutputURIHandler = (uri) => {
    setOutputURI(uri)
    setHasntRun(false)
  }

  const modelLoading = loadProg >= 0

  return (
    <div>
      {
        outputURI == null 
          ? <Image src={inputURI} width='512' height='512'/>
          : <div style={{width: '512px'}}>
              <ReactCompareSlider
                position={50}
                itemOne={<Image width='512' height='512' src={inputURI} />}
                itemTwo={<Image width='512' height='512' src={outputURI} />}
              />
            </div>
      }
      {
        outputURI != null 
          ? 
            <div>
                <input
                  type='file'
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      const fileObj = e.target.files[0]
                      setFileName(fileObj.name)
                      const reader = new FileReader()
                      reader.readAsArrayBuffer(fileObj)

                      reader.onloadend = () => {
                        const blob = new Blob([reader.result], { type: fileObj.type })
                        const urlCreator = window.URL || window.webkitURL
                        setInputURIHandler(urlCreator.createObjectURL(blob))
                      }
                    }
                  }}
                  onClick={e => e.target.value = null}
                />
            </div>
          : <div>
              <button
                disabled={modelLoading || running}
                onClick={() => {
                  setLoadProg(0)
                  setComplete(false)
                  initialize(setLoadProg)
                    .then(() => setRunning(true))
                    .then(() => upscale(inputURI, upscaleFactor)
                      .then(result => setOutputURIHandler(result))
                      .catch(error => setErrorMessage(error))
                      .finally(() => {
                        setRunning(false)
                        setComplete(true)
                        setUpscaleFactorHandler(2)
                      })
                    )
                    .catch(() => setErrorMessage('Could not load model.'))
                    .finally(() => setLoadProg(-1))
                }}
              >
                {
                  running ? 'Upscaling...' : !modelLoading ? 'Upscale' : 'Loading Model'
                }
              </button>
              <select
                onInput={inp => setUpscaleFactorHandler(parseInt(inp.target.value))}
                disabled={running}
              >
                <option value='2'>2X</option>
                <option value='4'>4X</option>
                <option value='8'>8X</option>
              </select>
            </div>
      }
      {
        complete && <button
          onClick={() => {
            const link = document.createElement('a')
            link.download = `${fileName}.${extension}`
            link.href = outputURI
            link.click()
          }}
          disabled={hasntRun}
        >
          Download
        </button>
      }
    </div>
  )
}
