import { ErrorSVG } from '@/components/SVGComponents'
import { useAppStateStore } from '@/services/useState'

export default function Error() {
  const errorMessage = useAppStateStore((state) => state.errorMessage)

  if (!errorMessage) return null

  return (
    <div className="flex items-center justify-center w-screen h-screen absolute">
      <div className="h-full w-full z-50 bg-gray-100 opacity-75 absolute" />
      <div className="rounded-md bg-pink-50 p-4 max-w-md absolute z-50 items-center">
        <div className="flex">
          <div className="flex-shrink-0">
            <ErrorSVG color="pink" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-pink-800">
              An unexpected error has occurred. Please refresh the page. 
            </h3>
            <div className="mt-2 text-sm text-pink-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>{errorMessage}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
