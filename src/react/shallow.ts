import React from 'react'
import { shallow } from '../vanilla/shallow.ts'

export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
  // 缓存上一次的值
  const prev = React.useRef<U>()
  return (state) => {
    const next = selector(state)
    // 使用 vanilla 中的 shallow 比较是否要更新
    return shallow(prev.current, next)
      ? (prev.current as U)
      : (prev.current = next)
  }
}
