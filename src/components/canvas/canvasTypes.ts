import p5 from 'p5'
import { MutableRefObject } from 'react'
import { Engine } from 'matter-js'
import useGlobalCanvas from '../../hooks/useGlobalCanvas'
import { P5Event } from '../../utils/p5Utils'
import { MotionSettingInterface } from '../../hooks/useMotion'
import Gimbal from '../../utils/helpers/motion/gimbal'

export interface CanvasState {
  mousePositionRef?: MutableRefObject<null | [number, number]>
  hideCursorRef?: MutableRefObject<boolean>
  motionSettingsRef?: MutableRefObject<MotionSettingInterface | undefined>
  gimbalRef?: MutableRefObject<Gimbal | null>
  engine?: Engine
}

export type p5Callback = (p5: p5) => void
export type p5EventCallback = (p5: p5, evt?: Event | UIEvent) => void
export type P5EventHandlers = Record<P5Event, p5EventCallback>

export type sketchEventCallback = (p5: p5, canvasStates: CanvasState) => void
export type SketchEventHandler = Record<P5Event | 'setup', sketchEventCallback> & {
  cleanup: (canvasStates: CanvasState) => void
}


export type CanvasRefType = ReturnType<typeof useGlobalCanvas>
export interface GlobalCanvasStates {
  canvasRef: CanvasRefType
  canvasStates: CanvasState
}

export interface PartialGlobalCanvasStates {
  canvasRef: CanvasRefType
  canvasStates?: CanvasState
}