import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser'
import Anchor from '../components/common/anchor'
import SmallText from '../components/common/styled/smallText'


type eventListenerOptions = boolean | AddEventListenerOptions
export function addEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap, R>(
  target: T,
  type: K,
  listener: (this: T, ev: HTMLElementEventMap[K]) => R,
  options?: eventListenerOptions
): () => void
export function addEventListener<T extends Element, K extends keyof ElementEventMap, R>(
  target: T,
  type: K,
  listener: (this: T, ev: ElementEventMap[K]) => R,
  options?: eventListenerOptions
): () => void
export function addEventListener<T extends Document, K extends keyof DocumentEventMap, R>(
  target: T,
  type: K,
  listener: (this: T, ev: DocumentEventMap[K]) => R,
  options?: eventListenerOptions
): () => void
export function addEventListener<T extends Window, K extends keyof WindowEventMap, R>(
  target: T,
  type: K,
  listener: (this: T, ev: WindowEventMap[K]) => R,
  options?: eventListenerOptions
): () => void
export function addEventListener(
  target: EventTarget,
  type: string,
  listener: (
    this: EventTarget,
    ev: Event
  ) => any,
  options?: boolean | AddEventListenerOptions
): () => void {
  target.addEventListener(type, listener, options)
  return () => target.removeEventListener(type, listener, options)
}


export const parseHtml = (string: string) => {
  string = string.replace(/—/g, ' — ')
  const options: HTMLReactParserOptions = {
    trim: true,
    replace: domNode => {
      if (!('attribs' in domNode)) return
      const { href, target } = domNode.attribs
      return 'name' in domNode && domNode.name === 'a' && href ?
        <Anchor
          to={href}
          target={target}>
          {domToReact(domNode.children, options)}
        </Anchor> : domNode.name === 'p' ?
          <SmallText>{domToReact(domNode.children, options)}</SmallText> : undefined
    }
  }
  return parse(string, options)
}