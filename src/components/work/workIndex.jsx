import { useRef, useState } from 'react'
import { styled } from 'styled-components'
import Masonry from '@mui/lab/Masonry'
import { useMediaQuery } from '@uidotdev/usehooks'
import WorkThumbnail from './workThumbnail'
import WorkIndexSidebar from './workIndexSideBar'
import MainContainer from '../common/styled/mainContainer'
import useSidebar from '../../hooks/useSidebar'
import useCanvas from '../../hooks/useCanvas'
import usePreloadQueue from '../../hooks/usePreloadQueue'
import drawWorkSketch from '../../p5/sketches/drawWorkSketch'
import { domSizes } from '../../styles/sizes'
import { queries } from '../../utils/queryUtil'
import workData from '../../data/work/workData'
import usePortfolioQuery from '../../hooks/usePortfolioQuery'

const WorkIndex = () => {
  const [highlighted, setHighlighted] = useState()
  const sidebarRef = useRef(null)
  const rosterRef = useRef(null)

  const handleHover = projectTitle => setHighlighted(projectTitle)

  const setupDone = useCanvas(() =>
    drawWorkSketch({ sidebarRef, rosterRef }))

  usePreloadQueue(setupDone, preloadManager =>
    preloadManager.defaultPreload())

  const { portfolioData } = usePortfolioQuery()
  const filteredWorkData = portfolioData?.projects.map(projectId =>
    workData.find(work => work.id === projectId)
  ) || workData
  useSidebar(<WorkIndexSidebar
    workData={filteredWorkData}
    highlighted={highlighted}
    sidebarRef={sidebarRef}
    handleHover={handleHover} />, [highlighted])

  const isExtraLargeDevice = useMediaQuery(queries.xl)
  const columns = isExtraLargeDevice ? 3 : 2

  return (
    <ThumbnailContainer $columns={columns}>
      <Masonry columns={columns}>
        {filteredWorkData.map(project => project.enabled && project.listed && <WorkThumbnail
          key={project.title}
          data={project}
          isHighlighted={highlighted === project.title}
          highlightedRef={rosterRef}
          handleHover={handleHover} />)}
      </Masonry>
    </ThumbnailContainer>
  )
}

const ThumbnailContainer = styled(MainContainer)`
  a {
    width: ${({ $columns }) => `calc(100% / ${$columns} - ${domSizes.workIndex.thumbnail.gap.css} * 2)`};
    margin: ${domSizes.workIndex.thumbnail.gap.css};
  }
`

export default WorkIndex