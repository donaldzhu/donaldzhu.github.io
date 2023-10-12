import { DependencyList, useEffect, useRef } from 'react'

const useMemoRef = <T>(factory: () => T, dependencies: DependencyList = []) => {
  const ref = useRef<T>()
  useEffect(() => { ref.current = factory() }, dependencies)
  return ref
}

export default useMemoRef