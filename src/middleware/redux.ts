import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'
import type { NamedSet } from './devtools.ts'

type Write<T, U> = Omit<T, keyof U> & U

// 定义一个 Redux 动作对象，包含一个 type 属性
type Action = { type: string }

type StoreRedux<A> = {
  dispatch: (a: A) => A
  dispatchFromDevtools: true // 是否支持从 Redux DevTools 分发 action
}

type ReduxState<A> = {
  dispatch: StoreRedux<A>['dispatch']
}

type WithRedux<S, A> = Write<S, StoreRedux<A>>

type Redux = <
  T,
  A extends Action,
  Cms extends [StoreMutatorIdentifier, unknown][] = [],
>(
  reducer: (state: T, action: A) => T,
  initialState: T,
) => StateCreator<Write<T, ReduxState<A>>, Cms, [['zustand/redux', A]]>

declare module '../vanilla' {
  interface StoreMutators<S, A> {
    'zustand/redux': WithRedux<S, A>
  }
}

type ReduxImpl = <T, A extends Action>(
  reducer: (state: T, action: A) => T, // 根据 action 更新状态
  initialState: T, // 初始状态
) => StateCreator<T & ReduxState<A>, [], []>

const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
  type S = typeof initial
  type A = Parameters<typeof reducer>[1]
    // 定义 dispatch 方法
    ; (api as any).dispatch = (action: A) => {
      ; (set as NamedSet<S>)((state: S) => reducer(state, action), false, action)
      return action
    }
    // 支持 Redux DevTools 的调试
    ; (api as any).dispatchFromDevtools = true

  return { dispatch: (...a) => (api as any).dispatch(...a), ...initial }
}
export const redux = reduxImpl as unknown as Redux
