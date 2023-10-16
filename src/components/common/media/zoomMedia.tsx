import { forwardRef, useContext } from 'react'
import { useOutletContext } from 'react-router-dom'
import styled from 'styled-components'
import { WorkPageContext } from '../../../contexts/context'
import mixins from '../../../styles/mixins'
import { joinPaths } from '../../../utils/commonUtils'
import useForwardedRef from '../../../hooks/useForwaredRef'
import { ImgStack, VidStack } from '../../../utils/helpers/preloader/mediaStack'
import { MediaFileType, MediaSize, MediaType } from '../../../utils/helpers/preloader/preloadUtils'
import { percent, toPercent } from '../../../utils/sizeUtils'
import { PageContextProps } from '../../pageWrappers/pageTypes'
import { MediaRef, ZoomMediaProps } from './mediaTypes'
import PreloadMedia from './preloadMedia'

const ZoomMedia = forwardRef(ZoomMediaWithRef)

interface StyledZoomMedia {
  $width: string | number | undefined
}

function ZoomMediaWithRef(props: ZoomMediaProps, ref: MediaRef) {
  const { preloadManager, handleZoomMedia } = useOutletContext<PageContextProps>()
  const { pageId, previewLoaded } = useContext(WorkPageContext)
  const mediaRef = useForwardedRef(ref)

  let { src } = props
  const { maxSize, width, isToolTip, ...rest } = props
  const { type } = rest

  const mediaType = isToolTip ?
    MediaType.ToolTips : type === MediaFileType.Image ?
      MediaType.Images : MediaType.Videos

  src = isToolTip ? joinPaths(MediaType.ToolTips, src) : src
  const fallbackPath = joinPaths('/assets/work', pageId, MediaSize.Max, src)
  const mediaStack = preloadManager.enabled ?
    preloadManager.workPages[pageId][mediaType]?.find(stack => stack.fileName === src) :
    undefined

  const handleClick = () =>
    handleZoomMedia({
      ...props,
      mediaStack,
      fallbackPath,
      getCurrentTime: () => (('current' in mediaRef && mediaRef.current && 'currentTime' in mediaRef.current) ?
        mediaRef.current?.currentTime : undefined) ?? 0,
      maxSize: typeof maxSize === 'number' ? toPercent(maxSize) : maxSize
    })

  return (
    <MediaContainer $width={width}>
      <PreloadMedia
        {...rest}
        {...(rest.type === MediaFileType.Video ? { canAutoPlay: previewLoaded } : {})}
        mediaStack={mediaStack satisfies ImgStack | VidStack | undefined}
        fallbackPath={fallbackPath}
        ref={mediaRef}
        onClick={handleClick} />
    </MediaContainer>
  )
}

const MediaContainer = styled.div<StyledZoomMedia>`
  ${mixins.flex('initial', 'center')}

  img, video {
    cursor: zoom-in;
    width: ${({ $width }) => $width ?? percent(100)};
    object-fit: cover;
  }
`

export default ZoomMedia