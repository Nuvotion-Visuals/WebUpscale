import { create } from 'zustand'
import default_tags from '@/services/landing_tags'

const useImageStore = create((set) => ({
  inputURI: './images/colorful-reaction-diffusion.png', // Input image URI
  outputURI: './images/colorful-reaction-diffusion_2x.png', // Output image URI
  tags: default_tags, // Tags returned by tagger network
  fileName: 'example', // Output file name
  extension: 'png', // Output file extension
  upscaleFactor: 1, // Upscale factor (will be automatically log2'd)
  hasntRun: true, // Upscale factor (will be automatically log2'd)
  tempURI: './images/colorful-reaction-diffusion.png',
  tempFileName: 'example',

  setInputURI: (uri) => {
    set(() => ({ inputURI: uri }))
    set(() => ({ outputURI: null }))
    set(() => ({ hasntRun: true }))

    useAppStateStore.setState({ downloadReady: false })

    if (uri.slice(0, 14) == 'data:image/gif') {
      set(() => ({ extension: 'gif' }))
    } else {
      set(() => ({ extension: 'png' }))
    }
  },
  setUpscaleFactor: (newFactor) => set(() => ({ upscaleFactor: Math.log2(newFactor) })),

  setOutputURI: (uri) => {
    set(() => ({ outputURI: uri }))
    set(() => ({ hasntRun: false }))
  },
  setTags: (newTags) => set(() => ({ tags: newTags })),
  setFileName: (newFilename) => set(() => ({ fileName: newFilename })),
  setTempURI: (newTempUri) => set(() => ({ tempURI: newTempUri })),
  setTempFileName: (newTempFileName) => set(() => ({ tempFileName: newTempFileName })),
}))

const useAppStateStore = create((set) => ({
  loadProg: -1, // Progress of model loading

  inputModalOpen: false, // Flag indicating if input modal is open
  mobile: false, // Are we on a mobile aspect ratio?
  errorMessage: null, // Error message to display
  running: false, // Flag indicating if we should run the model, fires a useEffect
  downloadReady: false, // Flag indicating upscale is ready for download
  feedbackMessage: null,
  isUploading: false,
  selectedPreset: 'none',

  setInputModalOpen: (newInputModalOpen) => set(() => ({ inputModalOpen: newInputModalOpen })),
  setMobile: (newMobile) => set(() => ({ mobile: newMobile })),
  setErrorMessage: (newError) => set(() => ({ errorMessage: newError })),
  setRunning: (newRunning) => set(() => ({ running: newRunning })),
  setLoadProg: (newProg) => set(() => ({ loadProg: newProg })),
  setDownloadReady: (newDownloadReady) => set(() => ({ downloadReady: newDownloadReady })),
  setFeedbackMessage: (newFeedbackMessage) => set(() => ({ feedbackMessage: newFeedbackMessage })),
  setIsUploading: (newIsUploading) => set(() => ({ isUploading: newIsUploading })),
  setSelectedPreset: (newSelectedPreset) => set(() => ({ selectedPreset: newSelectedPreset })),
}))

export { useImageStore, useAppStateStore }
