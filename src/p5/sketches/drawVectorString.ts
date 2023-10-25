import p5 from 'p5'
import { MutableRefObject } from 'react'
import ElemRect from '../../utils/helpers/rect/elemRect'
import Size from '../../utils/helpers/size'
import { validateRef } from '../../utils/typeUtils'
import configs from '../configs/vector'
import Text from '../helpers/vector/text'
import { PlaceholderProp } from './sketchTypes'

type DrawVectorStringProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>
} & PlaceholderProp


const drawVectorString = ({ containerRef, placeholderRef }: DrawVectorStringProps) => {
  let text: Text
  let placeholder: ElemRect<HTMLDivElement>
  let container: ElemRect<HTMLDivElement>

  const createVector = (p5: p5) =>
    text = new Text(p5, 'Ä', configs.VECTOR_STRING_TRANSLATE)

  const setup = (p5: p5) => {
    if (!validateRef(placeholderRef) || !validateRef(containerRef))
      throw new Error('Vector string has no placeholder or container ref.')
    placeholder = new ElemRect(placeholderRef)
    container = new ElemRect(containerRef)

    createVector(p5)
  }

  const draw = () => {
    const [x, y] = placeholder.center
    const size = placeholder.w * 0.35
    text.setTransform({ x, y, scale: new Size(size / 45) })
    text.setting.maxStretch = size / 6.25
    text.setMouseOrigin(container.center)
    text.write()
  }

  const windowResized = createVector

  return { setup, draw, windowResized }
}

export default drawVectorString
