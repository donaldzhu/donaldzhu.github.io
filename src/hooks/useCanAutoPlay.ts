import _ from 'lodash'
import { useEffect, useState } from 'react'
import { addEventListener } from '../utils/reactUtils'
import { FileExt } from '../utils/helpers/preloader/preloadUtils'
import useIsMobile from './useIsMobile'

const useCanAutoPlay = () => {
  const activationEvents: (keyof DocumentEventMap)[] =
    ['keydown', 'mousedown', 'pointerdown', 'pointerup', 'touchend']
  const [canAutoPlay, setCanAutoPlay] = useState<boolean | undefined>()
  const isMobile = useIsMobile()

  useEffect(() => {
    const video = document.createElement('video')
    video.src = '/assets/autoplay-test/test' + isMobile ? FileExt.Mp4 : FileExt.Webm
    video.muted = true
    video.playsInline = true
    video.play()
      .then(() => setCanAutoPlay(true))
      .catch(() => setCanAutoPlay(false))
  }, [])

  useEffect(() => {
    if (canAutoPlay) return _.noop
    const listenerRemovers = activationEvents.map(eventName =>
      addEventListener(document, eventName, () => setCanAutoPlay(true))
    )
    return () => listenerRemovers.forEach(remover => remover())
  }, [canAutoPlay])

  return canAutoPlay
}

export default useCanAutoPlay