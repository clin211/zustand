import type { StateCreator, StoreMutatorIdentifier } from '../vanilla.ts'

type SubscribeWithSelector = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<
    T,
    [...Mps, ['zustand/subscribeWithSelector', never]],
    Mcs
  >,
) => StateCreator<T, Mps, [['zustand/subscribeWithSelector', never], ...Mcs]>

type Write<T, U> = Omit<T, keyof U> & U

type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
  ? Write<S, StoreSubscribeWithSelector<T>>
  : never

declare module '../vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    ['zustand/subscribeWithSelector']: WithSelectorSubscribe<S>
  }
}

type StoreSubscribeWithSelector<T> = {
  subscribe: {
    (listener: (selectedState: T, previousSelectedState: T) => void): () => void
    <U>(
      selector: (state: T) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: {
        equalityFn?: (a: U, b: U) => boolean
        fireImmediately?: boolean
      },
    ): () => void
  }
}

type SubscribeWithSelectorImpl = <T extends object>(
  storeInitializer: StateCreator<T, [], []>,
) => StateCreator<T, [], []>

// 接收一个 store 初始化函数 fn，并返回一个新的 store 创建函数
const subscribeWithSelectorImpl: SubscribeWithSelectorImpl =
  (fn) => (set, get, api) => {
    type S = ReturnType<typeof fn>
    type Listener = (state: S, previousState: S) => void
    // 暂存原来的 subscribe
    const origSubscribe = api.subscribe as (listener: Listener) => () => void
    // 在原来 subscribe 的基础上扩展
    api.subscribe = ((selector: any, optListener: any, options: any) => {
      let listener: Listener = selector // 如果没有选择器，直接使用传入的监听器
      if (optListener) {
        // 比较选择器返回的新旧值，默认是 Object.is 方法
        const equalityFn = options?.equalityFn || Object.is
        let currentSlice = selector(api.getState())
        listener = (state) => {
          const nextSlice = selector(state)
          // 值有变化，则调用监听器
          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice
            optListener((currentSlice = nextSlice), previousSlice)
          }
        }
        // 如果设置了 fireImmediately 选项，立即触发一次监听器
        if (options?.fireImmediately) {
          optListener(currentSlice, currentSlice)
        }
      }
      // 调用原始的 subscribe 方法来注册这个新创建的监听器并返回
      return origSubscribe(listener)
    }) as any
    // 调用原始的 store 初始化函数 fn，并返回初始状态
    const initialState = fn(set, get, api)
    return initialState
  }
export const subscribeWithSelector =
  subscribeWithSelectorImpl as unknown as SubscribeWithSelector
