import { styled } from 'styled-components'
import mixins from '../../../styles/mixins'
import { domSizes } from '../../../styles/sizes'
import { fontParams } from '../../../styles/fonts'

const TextContainer = styled.div`
  ${mixins
    .chain()
    .fontVar({ MONO: fontParams.monoVariable })
    .innerMargin(domSizes.text.innerMargin.css)}

  &>:last-child {
    padding-bottom: ${domSizes.sidebar.padding.vert.css};
  }
`

export default TextContainer