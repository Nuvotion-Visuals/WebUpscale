import { useState, useEffect } from 'react'
import { initialize, upscale } from 'upscale'
import { ReactCompareSlider } from 'react-compare-slider'
import localForage from 'localforage'
import styled from 'styled-components'
import Droppable from '@/components/Droppable'

export default function Main() {
  const [inputURIQueue, setInputURIQueue] = useState([])
  const [outputURIQueue, setOutputURIQueue] = useState([])
  const [fileNameQueue, setFileNameQueue] = useState([])
  const [displayFileNameQueue, setDisplayFileNameQueue] = useState([]) 
  const [displayInputURIQueue, setDisplayInputURIQueue] = useState([]) 
  const [statusQueue, setStatusQueue] = useState([]) 
  const [extensionQueue, setExtensionQueue] = useState([])
  const [upscaleFactor, setUpscaleFactor] = useState(1)
  const [loadProg, setLoadProg] = useState(-1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeProcessIndex, setActiveProcessIndex] = useState(null) 
  const [progress, setProgress] = useState(0)
  

  useEffect(() => {
    if (statusQueue[activeProcessIndex] === 'Queued' && loadProg === -1) {
      upscaleImage(inputURIQueue[activeProcessIndex], activeProcessIndex)
    }
  }, [inputURIQueue, activeProcessIndex, loadProg, statusQueue])

  // New state to track if the data has been loaded from localForage
const [dataLoaded, setDataLoaded] = useState(false)

useEffect(() => {
  async function fetchData() {
      const inputFiles = await localForage.getItem('inputFiles')  // Get File objects
      const outputURIs = await localForage.getItem('outputURIs')
      const fileNames = await localForage.getItem('fileNames')
      const displayFileNames = await localForage.getItem('displayFileNames')
      const displayInputURIs = await localForage.getItem('displayInputURIs')
      const statuses = await localForage.getItem('statuses')
      const extensions = await localForage.getItem('extensions')

      if (inputFiles && outputURIs && fileNames && displayFileNames && displayInputURIs && statuses && extensions) {
          // Reset any 'Processing' status to 'Queued'
          const resetStatuses = statuses.map(status => status === 'Processing' ? 'Queued' : status)

          setInputURIQueue(inputFiles)  // Use the File objects
          setOutputURIQueue(outputURIs)
          setFileNameQueue(fileNames)
          setDisplayFileNameQueue(displayFileNames)
          setDisplayInputURIQueue(displayInputURIs)
          setStatusQueue(resetStatuses)  // Use the reset statuses
          setExtensionQueue(extensions)
          setDataLoaded(true)  // Mark data as loaded
      }
  }
  fetchData()
}, [])

useEffect(() => {
  // Check if the data has been loaded before persisting
  if (dataLoaded) {
      localForage.setItem('inputFiles', inputURIQueue)  // Persist File objects
      localForage.setItem('outputURIs', outputURIQueue)
      localForage.setItem('fileNames', fileNameQueue)
      localForage.setItem('displayFileNames', displayFileNameQueue)
      localForage.setItem('displayInputURIs', displayInputURIQueue)
      localForage.setItem('statuses', statusQueue)
      localForage.setItem('extensions', extensionQueue)
  }
}, [dataLoaded, inputURIQueue, outputURIQueue, fileNameQueue, displayFileNameQueue, displayInputURIQueue, statusQueue, extensionQueue])


const upscaleImage = async (inputFile, index) => {
  setLoadProg(0)
  setStatusQueue(prevQueue => {
    const newQueue = [...prevQueue]
    newQueue[index] = 'Processing'
    return newQueue
  })
  initialize(setLoadProg)
    .then(() => {
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            const result = await upscale(reader.result, upscaleFactor, newProgress => setProgress(newProgress))
            setOutputURIQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index] = result
              return newQueue
            })
            setStatusQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index] = 'Completed'
              return newQueue
            })
          } catch(error) {
            setStatusQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index] = 'Error: ' + error
              return newQueue
            })
          }
        };
        reader.readAsDataURL(inputFile);  // Convert the File object to a Data URL
    })
    .catch(() => setStatusQueue(prevQueue => {
      const newQueue = [...prevQueue]
      newQueue[index] = 'Could not load model.'
      return newQueue
    }))
    .finally(() => {
      setLoadProg(-1)
      if (activeProcessIndex < inputURIQueue.length - 1) {
        setActiveProcessIndex(activeProcessIndex + 1)
      } else {
        setActiveProcessIndex(null)
      }
    })
}


  const fileUploadHandler = (files) => {
    if (files[0]) {
      let fileObjects = Array.from(files)
      fileObjects.forEach(fileObj => {
        setInputURIQueue(prevQueue => [fileObj, ...prevQueue])  // Directly store the File object
        setOutputURIQueue(prevQueue => [null, ...prevQueue])
        setFileNameQueue(prevQueue => [fileObj.name, ...prevQueue])
        setDisplayFileNameQueue(prevQueue => [fileObj.name.split('.').shift(), ...prevQueue])
        
        const reader = new FileReader();
        reader.onload = function(e) {
          setDisplayInputURIQueue(prevQueue => [reader.result, ...prevQueue])  // Store the data URL for displaying the image
        };
        reader.readAsDataURL(fileObj);  // Convert the File object to a data URL for displaying
        
        setStatusQueue(prevQueue => ['Queued', ...prevQueue])
        setExtensionQueue(prevQueue => [fileObj.name.split('.').pop(), ...prevQueue])
      })
    }
  }

  const removeFileHandler = (index) => {
    setInputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setOutputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setFileNameQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setDisplayFileNameQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setDisplayInputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setStatusQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setExtensionQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
  }

  return (
    <S.Container>
      <S.Sidebar>
        <img id='logo' src="webupscale-typography.svg" alt="WebUpscale"/>

        <S.Description>Upscale batches of images in your browser with AI - private, free, and no installation required.</S.Description>

        <Droppable
          onDrop={(files) => fileUploadHandler(files)}
          onClick={() => {document.getElementById("hiddenFileInput").click()}}
        >
          <span style={{width: '140px'}}>
            <button onClick={e => {
              e.stopPropagation()
              document.getElementById("hiddenFileInput").click();
            }}>
              Upload
            </button>
          </span>
          <input type="file" id="hiddenFileInput" hidden onChange={e => fileUploadHandler(e.target.files)} />

        </Droppable>
       
       <S.Upscale>
       
       <button
          onClick={() => {
            if (statusQueue.length > 0 && statusQueue[activeProcessIndex] !== 'Processing') {
              setActiveProcessIndex(0)
            }
          }}
          disabled={!inputURIQueue.length}
        >
          Start Upscaling
        </button>
        <select onInput={inp => setUpscaleFactor(parseInt(inp.target.value))}>
          <option value='2'>2x</option>
          <option value='4'>4x</option>
          <option value='8'>8x</option>
        </select>
       </S.Upscale>
      
      <S.Items>
        {
          inputURIQueue.map((inputURI, index) => (
            <S.Item key={index} active={activeIndex === index} onClick={() => setActiveIndex(index)}>
              <S.Thumbnail src={displayInputURIQueue[index]} /> 
              <S.Details>
                <S.Name >{`${displayFileNameQueue[index]}.${extensionQueue[index]}`}</S.Name>
                <S.Status> {statusQueue[index]}</S.Status>{ statusQueue[index] === 'Processing' && <progress />}
              </S.Details>

              <S.Spacer />

              <S.Buttons>
              {
                statusQueue[index] === 'Completed' && <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const link = document.createElement('a')
                    link.download = `${fileNameQueue[index]}_upscaled.${extensionQueue[index]}`
                    link.href = outputURIQueue[index]
                    link.click()
                  }}
                >
                  Download
                </button>
              }
              <button className={'delete-button'} onClick={() => removeFileHandler(index)}>X</button>
              </S.Buttons>
            </S.Item>
          ))
        }
      </S.Items>
     
      </S.Sidebar>
      <S.Content>
      {
          outputURIQueue[activeIndex] 
            ? 
                <ReactCompareSlider
                  position={50}
                  itemOne={<S.Image src={displayInputURIQueue[activeIndex]} />}
                  itemTwo={<S.Image src={outputURIQueue[activeIndex]} />}
                />
            : 'Your upscales will appear here.'
        }
      </S.Content>
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    width: 100%;
    height: 100vh;
    background: black;
    display: flex;
  `,

  Description: styled.div`
    font-size: 13px;
    line-height: 19.5px;
    margin-bottom: 20px;
    color: #ccc;
  `,


  Sidebar: styled.div`
    width: calc(100% - 32px);
    max-width: 400px;
    padding: 8px 16px;
    height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    background-color: #121212;
  `,

  FileDrop: styled.div`
  
  `,

  Buttons: styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-right: 8px;
  `,

  Upscale: styled.div`
    display: flex;
    width: 100%;
    gap: 8px;  
    margin: 16px 0;
  `,


  Queue: styled.div`

  `,

  Spacer: styled.div`
    display: flex;
    flex-grow: 1;
  `,

  Items: styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  `,

  Item: styled.div`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    background: ${props => props.active ? 'var(--Surface_0)' : 'none'};
    border-radius: 8px;
    overflow: hidden;
  `,

  Thumbnail: styled.img`
    width: 50px;
    height: 50px;
    object-fit: contain;
  `,

  Progress: styled.div`
  
  `,

  Details: styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 8px;
  `,

  Name: styled.div`
    font-size: 13px;
    width: 100%;
  `,

  Status: styled.div`
    font-size: 12px;
    color: #ccc;
  `,

  Content: styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `,

  Image: styled.img`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    object-fit: contain;
  `,
}