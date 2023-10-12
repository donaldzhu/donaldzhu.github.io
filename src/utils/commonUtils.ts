import ElemRect from './helpers/rect/elemRect'
import { coorTuple } from './helpers/rect/rectType'

// string
export const capitalize = (string: string) => string.charAt(0)
  .toUpperCase() + string.slice(1)

// number
export const map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
export const isOdd = (number: number) => !!(number % 2)

export const sum = (array: number[]) => array.reduce((prev, curr) => prev + curr)

// array
export const repeatMap = <T>(repetition: number, callback: (i: number) => T) => {
  const accumulatedReturns: T[] = []
  for (let i = 0; i < repetition; i++)
    accumulatedReturns.push(callback(i))
  return accumulatedReturns
}

export const repeat = <T>(repetition: number, value: T) => Array(repetition).fill(value)

export const arrayify = <T>(possibleArray: T | T[]) => Array.isArray(possibleArray) ? possibleArray : [possibleArray]
export const shuffleTo = <T>(array: T[], index: number) => {
  array = [...array]
  return [...array.splice(index), ...array]
}

export const sortLike = <T>(array: T[], modelArray: T[]) =>
  array.sort((a, b) =>
    modelArray.indexOf(a) - modelArray.indexOf(b))

export const filterFalsy = <T>(elem: T) => !!elem


// object
export const loopObject = <T extends object>(
  object: T,
  callback: (key: keyof T, value: T[keyof T], object: T) => any
) => {
  const keys = typedKeys(object)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = object[key]
    callback(key, value, object)
  }
  return object
}

export const mapObject = <T extends object, R>(
  object: T,
  callback: (key: keyof T, value: T[keyof T]) => R
) => {
  const newObject: Partial<Record<keyof T, R>> = {}
  const keys = typedKeys(object)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = object[key]
    newObject[key] = callback(key, value)
  }
  return newObject as Record<keyof T, R>
}

export const keysToObject = <V>(array: string[], callback: (
  key: string,
  obj: Record<string, V>,
  i: number) => V) => array.reduce((obj, key, i) => ({
    ...obj, [key]: callback(key, obj, i)
  }), {})

// util
export const getVw = (percentage = 100) => window.innerWidth / 100 * percentage
export const getVh = (percentage = 100) => window.innerHeight / 100 * percentage
export const getRem = (multiplier = 1) => parseFloat(getComputedStyle(
  document.documentElement).fontSize) * multiplier

export const getNativeResolution = () => [
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
]

export const joinPaths = (...paths: string[]) => paths.filter(p => p).join('/')
export const appendQuery = (...queries: [string, string | null | undefined][]) => queries.reduce((string, [queryKey, queryValue], i) =>
  string += i ? '&' : '' + `${queryKey}=${queryValue}`, '?')

export const getToolTipPoints = <T extends Element>(toolTip: ElemRect<T>, popUp: ElemRect<T>):
  [coorTuple, coorTuple, coorTuple, coorTuple] => {
  if (popUp.y2 >= toolTip.y2 && popUp.y1 <= toolTip.y1)
    return [popUp.topRight, toolTip.topRight, toolTip.botRight, popUp.botRight]
  if (popUp.y2 <= toolTip.y2)
    return [popUp.topRight, toolTip.topRight, toolTip.botLeft, popUp.botLeft]
  return [popUp.topLeft, toolTip.topLeft, toolTip.botRight, popUp.botRight]
}

// funuction 
export const callFunctionLike = <T>(functionLike: (() => T | T)) => typeof functionLike === 'function' ? functionLike() : functionLike

export function validateString(string: string): string
export function validateString<T>(validator: T, string?: string): string
export function validateString<T>(validatorOrString: T | string, string?: string) {
  if (!string) return validatorOrString || ''
  return validatorOrString ? string : ''
}

export function typedKeys<T extends object>(object: T): (keyof T)[]
export function typedKeys<T extends string>(object: object): T[]
export function typedKeys<T extends (object | string)>(object: T) {
  return Object.keys(object) as (T extends object ? keyof T : T)[]
}

