const isIterable = (obj: object): obj is Iterable<unknown> =>
  Symbol.iterator in obj

const compareMapLike = (
  iterableA: Iterable<[unknown, unknown]>,
  iterableB: Iterable<[unknown, unknown]>,
) => {
  const mapA = iterableA instanceof Map ? iterableA : new Map(iterableA)
  const mapB = iterableB instanceof Map ? iterableB : new Map(iterableB)
  if (mapA.size !== mapB.size) return false
  for (const [key, value] of mapA) {
    if (!Object.is(value, mapB.get(key))) {
      return false
    }
  }
  return true
}

export function shallow<T>(objA: T, objB: T): boolean {
  // 浅比较是否相等
  if (Object.is(objA, objB)) {
    return true
  }
  // 做引用类型的判断
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  // 两个对象是否是可迭代的
  if (isIterable(objA) && isIterable(objB)) {
    const iteratorA = objA[Symbol.iterator]()
    const iteratorB = objB[Symbol.iterator]()
    let nextA = iteratorA.next()
    let nextB = iteratorB.next()

    // 两个都是数组且长度都为 2
    if (
      Array.isArray(nextA.value) &&
      Array.isArray(nextB.value) &&
      nextA.value.length === 2 &&
      nextB.value.length === 2
    ) {
      // Map 比较
      return compareMapLike(
        objA as Iterable<[unknown, unknown]>,
        objB as Iterable<[unknown, unknown]>,
      )
    }
    // 逐个比较两个可迭代对象中的元素
    while (!nextA.done && !nextB.done) {
      if (!Object.is(nextA.value, nextB.value)) {
        return false
      }
      nextA = iteratorA.next()
      nextB = iteratorB.next()
    }
    return !!nextA.done && !!nextB.done
  }

  // 对比两个对象的键的长度
  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) {
    return false
  }

  // 对比两个对象的每个键的值
  for (const keyA of keysA) {
    if (
      !Object.hasOwn(objB, keyA as string) ||
      !Object.is(objA[keyA as keyof T], objB[keyA as keyof T])
    ) {
      return false
    }
  }
  return true
}
