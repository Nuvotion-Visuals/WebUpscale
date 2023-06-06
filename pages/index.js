import { useState, useEffect } from 'react'
import { initialize, upscale } from 'upscale'
import { ReactCompareSlider } from 'react-compare-slider'
import localForage from 'localforage'
import styled from 'styled-components'
import Droppable from '@/components/Droppable'

export default function Main() {
  const [upscaleQueue, setUpscaleQueue] = useState([])
  const [upscaleFactor, setUpscaleFactor] = useState(1)
  const [loadProg, setLoadProg] = useState(-1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeProcessIndex, setActiveProcessIndex] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (upscaleQueue[activeProcessIndex]?.status === 'Queued' && loadProg === -1) {
      upscaleImage(activeProcessIndex)
    }
  }, [upscaleQueue, activeProcessIndex, loadProg])

  useEffect(() => {
    async function fetchData() {
      const savedQueue = await localForage.getItem('upscaleQueue')
      if (savedQueue) {
        const queue = savedQueue.map(item => {
          if (item.status === 'Upscaling') {
            item.status = 'Queued'
          }
          return item
        })
        setUpscaleQueue(queue)
      }
      setDataLoaded(true)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (dataLoaded) {
      localForage.setItem('upscaleQueue', upscaleQueue)
    }
  }, [dataLoaded, upscaleQueue])

  const upscaleImage = async (index) => {
     // Check if the image is already completed
    if(upscaleQueue[index].status === 'Completed') {
      // If the image is completed and it's not the last image in the queue
      if(index < upscaleQueue.length - 1) {
        upscaleImage(index + 1); // Call the next image in the queue
      }
      return; // Do not continue with the current image
    }
    setLoadProg(0)
    setUpscaleQueue(prevQueue => {
      const newQueue = [...prevQueue]
      newQueue[index].status = 'Upscaling'
      return newQueue
    })
    initialize(setLoadProg)
      .then(() => {
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            const result = await upscale(reader.result, upscaleFactor, newProgress => setProgress(newProgress))
            setUpscaleQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index].outputURI = result
              newQueue[index].status = 'Completed'
              return newQueue
            })
            if (index < upscaleQueue.length - 1) { // check if there are more items to process
              upscaleImage(index + 1); // call the next item in the queue
            }
          } catch(error) {
            setUpscaleQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index].status = 'Error: ' + error
              return newQueue
            })
            if (index < upscaleQueue.length - 1) { // check if there are more items to process
              upscaleImage(index + 1); // call the next item in the queue
            }
          }
        };
        reader.readAsDataURL(upscaleQueue[index].inputFile);
      })
      .catch(() => setUpscaleQueue(prevQueue => {
        const newQueue = [...prevQueue]
        newQueue[index].status = 'Could not load model.'
        return newQueue
      }))
      .finally(() => {
        setLoadProg(-1)
      })
  }
  

  const fileUploadHandler = (files) => {
    if (files[0]) {
      let fileObjects = Array.from(files)
      fileObjects.forEach(fileObj => {
        const reader = new FileReader();
        reader.onload = function(e) {
          setUpscaleQueue(prevQueue => [
            {
              inputFile: fileObj,
              outputURI: null,
              fileName: fileObj.name,
              displayFileName: fileObj.name.split('.').shift(),
              displayInputURI: reader.result,
              status: 'Queued',
              extension: fileObj.name.split('.').pop()
            }, 
            ...prevQueue
          ])
        };
        reader.readAsDataURL(fileObj);
      })
    }
  }

  const removeFileHandler = (index) => {
    setUpscaleQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
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
          <input type="file" id="hiddenFileInput" hidden multiple accept="image/*" onChange={e => fileUploadHandler(e.target.files)} />
        </Droppable>
  
        <S.Upscale>
        <button
          onClick={() => {
            if (upscaleQueue.length > 0 && upscaleQueue[0]?.status !== 'Upscaling') {
              upscaleImage(0) // start the upscaling from the first item in the queue
            }
          }}
          disabled={!upscaleQueue.length}
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
            upscaleQueue.map((item, index) => (
              <S.Item key={index} active={activeIndex === index} onClick={() => setActiveIndex(index)}>
                <S.Thumbnail src={item.displayInputURI} />
                <S.Details>
                  <S.Name >{`${item.displayFileName}.${item.extension}`}</S.Name>
                  <S.Status> {item.status}</S.Status>{ item.status === 'Upscaling' && <progress />}
                </S.Details>
  
                <S.Spacer />
  
                <S.Buttons>
                {
                  item.status === 'Completed' && <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.download = `${item.fileName}_upscaled.${item.extension}`
                      link.href = item.outputURI
                      link.click()
                    }}
                  >
                    Download
                  </button>
                }
                <button className={'delete-button'} onClick={() => removeFileHandler(index)}>✕</button>
                </S.Buttons>
              </S.Item>
            ))
          }
        </S.Items>
      </S.Sidebar>
  
      <S.Content>
      {
          upscaleQueue.length
            ? upscaleQueue[activeIndex]?.outputURI
              ? 
                <ReactCompareSlider
                  position={50}
                  itemOne={<S.Image src={upscaleQueue[activeIndex].displayInputURI} />}
                  itemTwo={<S.Image src={upscaleQueue[activeIndex].outputURI} />}
                />
              : upscaleQueue[activeIndex]?.displayInputURI
                ? <ReactCompareSlider
                    position={50}
                    itemOne={<S.Image src={upscaleQueue[activeIndex].displayInputURI} />}
                    itemTwo={<S.Image src={'/empty.svg'} />}
                  />
                : 'Your upscales will appear here.'
            : <ReactCompareSlider
                position={50}
                itemOne={<S.Image src={'/images/colorful-reaction-diffusion.png'} />}
                itemTwo={<S.Image src={'/images/colorful-reaction-diffusion_4x.png'} />}
              />
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
    padding-bottom: 0;
    height: calc(100vh - 8px);
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
    height: calc(100vh - 292px);
    overflow-y: auto;
    align-content: flex-start;
  `,

  Item: styled.div`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    background: ${props => props.active ? 'var(--Surface_0)' : 'none'};
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
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
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  `,

  Image: styled.img`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    object-fit: contain;
  `,
}