import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useOutletContext } from 'react-router-dom'
import { WorkPageContext } from '../../contexts/context'
import workDescriptions from '../../data/work/workDescriptions.json'
import useCanvas from '../../hooks/useCanvas'
import usePreloadQueue from '../../hooks/usePreloadQueue'
import useSidebar from '../../hooks/useSidebar'
import drawToolTip from '../../p5/sketches/drawToolTip'
import { fontLineHeights, fontSizes } from '../../styles/fonts'
import mixins from '../../styles/mixins'
import { domSizes } from '../../styles/sizes'
import { capitalize } from '../../utils/commonUtils'
import { parseHtml } from '../../utils/reactUtils'
import MainContainer from '../common/styled/mainContainer'
import TextContainer from '../common/styled/textContainer'
import { PageContextProps } from '../pageWrappers/pageTypes'
import { MediaSize, getPreviewBreakptKey } from '../../utils/helpers/preloader/preloadUtils'
import { WorkDataInterface } from './workIndex'

interface WorkPageProps {
  data: WorkDataInterface
  Content: () => JSX.Element
}

const typedWorkDescriptions: Record<string, string> = workDescriptions
const WorkPage = ({ data, Content }: WorkPageProps) => {
  const toolTipRef = useRef<HTMLDivElement>(null)
  const popUpRef = useRef<HTMLDivElement>(null)
  const setupDone = useCanvas(() =>
    drawToolTip({ toolTipRef, popUpRef }))
  usePreloadQueue(setupDone, preloadManager =>
    preloadManager.pagePreload(data.id), [data])
  useSidebar(<WorkPageSidebar {...data} />)
  const [previewLoaded, setPreviewLoaded] = useState(false)

  const pageId = data.id

  const { preloadManager } = useOutletContext<PageContextProps>()
  const imageSizes = preloadManager.workPages[pageId].images?.map(imgStack => imgStack.loadedSizes)
  useEffect(() => {
    if (!imageSizes) return setPreviewLoaded(true)
    const previewKey = getPreviewBreakptKey()
    setPreviewLoaded(imageSizes?.every(sizes =>
      sizes.includes(previewKey ?? MediaSize.DesktopFallback)))
  }, [imageSizes])

  return (
    <WorkPageContext.Provider value={{ toolTipRef, popUpRef, pageId, previewLoaded }}>
      <MainContainer>
        <ContentContainer>
          <Content />
        </ContentContainer>
      </MainContainer>
    </WorkPageContext.Provider>
  )
}

const WorkPageSidebar = ({ title, id, date, tags, medium }: WorkDataInterface) =>
  <div>
    <h1>{title}</h1>
    <Details>
      <p>{date}</p>
      <p>{capitalize(tags.join('/').toLocaleLowerCase())}</p>
      <p>{capitalize(medium.join(', ').toLocaleLowerCase())}</p>
    </Details>
    <TextContainer>{parseHtml(typedWorkDescriptions[id])}</TextContainer>
  </div>

const ContentContainer = styled.div`
  ${mixins.innerMargin(domSizes.workPage.media.gap.css)}
`

const Details = styled.div`
  font-size: ${fontSizes.workPage.details.css};
  line-height: ${fontLineHeights.text};
  margin-bottom: ${domSizes.text.innerMargin.css};
  font-weight: 450;

  :first-child{
    ${mixins.fontVar({ MONO: 1 })};
  }
`

export default WorkPage