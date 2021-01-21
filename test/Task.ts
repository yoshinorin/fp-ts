import { pipe } from '../src/function'
import * as I from '../src/IO'
import * as RA from '../src/ReadonlyArray'
import * as _ from '../src/Task'
import { assertPar, assertSeq, deepStrictEqual } from './util'

const delayReject = <A>(n: number, a: A): _.Task<A> => () =>
  new Promise<A>((_, reject) => {
    setTimeout(() => reject(a), n)
  })

const delay = <A>(millis: number, a: A): _.Task<A> => _.delay(millis)(_.of(a))

describe('Task', () => {
  // -------------------------------------------------------------------------------------
  // type class members
  // -------------------------------------------------------------------------------------

  it('map', async () => {
    const double = (n: number): number => n * 2
    deepStrictEqual(await pipe(delay(1, 2), _.map(double))(), 4)
  })

  it('ap', async () => {
    const double = (n: number): number => n * 2
    deepStrictEqual(await pipe(delay(1, double), _.ap(delay(0, 2)))(), 4)
  })

  it('apFirst', async () => {
    deepStrictEqual(await pipe(_.of('a'), _.apFirst(_.of('b')))(), 'a')
  })

  it('apSecond', async () => {
    deepStrictEqual(await pipe(_.of('a'), _.apSecond(_.of('b')))(), 'b')
  })

  it('chain', async () => {
    const f = (n: number): _.Task<number> => () => Promise.resolve(n * 2)
    return deepStrictEqual(await pipe(delay(1, 2), _.chain(f))(), 4)
  })

  it('chainFirst', async () => {
    const f = (n: number): _.Task<number> => () => Promise.resolve(n * 2)
    return deepStrictEqual(await pipe(delay(1, 2), _.chainFirst(f))(), 2)
  })

  it('flatten', async () => {
    return deepStrictEqual(await pipe(_.of(_.of('a')), _.flatten)(), 'a')
  })

  it('fromIO', async () => {
    const io = () => 1
    const t = _.fromIO(io)
    deepStrictEqual(await t(), 1)
  })

  // -------------------------------------------------------------------------------------
  // instances
  // -------------------------------------------------------------------------------------

  it('ApplicativeSeq', async () => {
    await assertSeq(_.ApplySeq, _.FromTask, (fa) => fa())
    await assertSeq(_.ApplicativeSeq, _.FromTask, (fa) => fa())
  })

  it('ApplicativePar', async () => {
    await assertPar(_.ApplyPar, _.FromTask, (fa) => fa())
    await assertPar(_.ApplicativePar, _.FromTask, (fa) => fa())
  })

  describe('getRaceMonoid', () => {
    const M = _.getRaceMonoid<number>()

    it('concat', async () => {
      deepStrictEqual(await pipe(delay(10, 1), M.concat(delay(10, 2)))(), 1)
    })

    it('empty (right)', async () => {
      deepStrictEqual(await pipe(delay(10, 1), M.concat(M.empty))(), 1)
    })

    it('empty (left)', async () => {
      deepStrictEqual(await pipe(M.empty, M.concat(delay(10, 1)))(), 1)
    })

    it('concat (rejected)', async () => {
      try {
        await pipe(delayReject(10, 1), M.concat(delayReject(10, 2)))()
      } catch (actual) {
        return deepStrictEqual(actual, 1)
      }
    })
  })

  // -------------------------------------------------------------------------------------
  // combinators
  // -------------------------------------------------------------------------------------

  it('chainIOK', async () => {
    const f = (s: string) => I.of(s.length)
    deepStrictEqual(await pipe(_.of('a'), _.chainIOK(f))(), 1)
  })

  it('do notation', async () => {
    deepStrictEqual(
      await pipe(
        _.of(1),
        _.bindTo('a'),
        _.bind('b', () => _.of('b'))
      )(),
      { a: 1, b: 'b' }
    )
  })

  it('apS', async () => {
    deepStrictEqual(await pipe(_.of(1), _.bindTo('a'), _.apS('b', _.of('b')))(), { a: 1, b: 'b' })
  })

  it('apT', async () => {
    deepStrictEqual(await pipe(_.of(1), _.tupled, _.apT(_.of('b')))(), [1, 'b'])
  })

  describe('array utils', () => {
    it('sequenceReadonlyArray', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(await pipe(arr, RA.map(_.of), _.sequenceReadonlyArray)(), arr)
    })

    it('traverseReadonlyArray', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(await pipe(arr, _.traverseReadonlyArray(_.of))(), arr)
    })

    it('traverseReadonlyArrayWithIndex', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(
        await pipe(
          arr,
          _.traverseReadonlyArrayWithIndex((index, _data) => _.of(index))
        )(),
        arr
      )
    })

    it('sequenceReadonlyArraySeq', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(await pipe(arr, RA.map(_.of), _.sequenceReadonlyArraySeq)(), arr)
    })

    it('traverseReadonlyArraySeq', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(await pipe(arr, _.traverseReadonlyArraySeq(_.of))(), arr)
    })

    it('traverseReadonlyArrayWithIndexSeq', async () => {
      const arr = RA.range(0, 10)
      deepStrictEqual(
        await pipe(
          arr,
          _.traverseReadonlyArrayWithIndexSeq((index, _data) => _.of(index))
        )(),
        arr
      )
    })
  })
})
